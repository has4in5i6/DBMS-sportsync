const db = require('../db');

const searchCoaches = async ({ sport, city, skillLevel }) => {
  const params = [];
  const conditions = [`u.role = 'coach'`];

  if (sport) {
    params.push(sport);
    conditions.push(`u.primary_sport = $${params.length}`);
  }

  if (city) {
    params.push(`%${city}%`);
    conditions.push(`u.city ILIKE $${params.length}`);
  }

  if (skillLevel) {
    params.push(skillLevel);
    conditions.push(`u.skill_level = $${params.length}`);
  }

  const result = await db.query(
    `SELECT
      u.id,
      u.full_name,
      u.primary_sport,
      u.skill_level,
      u.city,
      u.bio,
      cp.experience_years,
      cp.hourly_rate,
      cp.coaching_history,
      COALESCE(AVG(r.rating), 0)::numeric(10,2) AS average_rating,
      COUNT(r.id)::int AS review_count
     FROM users u
     JOIN coach_profiles cp ON cp.user_id = u.id
     LEFT JOIN reviews r ON r.coach_id = u.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY u.id, cp.user_id
     ORDER BY average_rating DESC, cp.hourly_rate ASC`,
    params,
  );

  return result.rows;
};

const getCoachById = async (coachId) => {
  const result = await db.query(
    `SELECT
      u.id,
      u.full_name,
      u.primary_sport,
      u.skill_level,
      u.city,
      u.bio,
      cp.experience_years,
      cp.hourly_rate,
      cp.coaching_history,
      COALESCE(AVG(r.rating), 0)::numeric(10,2) AS average_rating,
      COUNT(r.id)::int AS review_count
     FROM users u
     JOIN coach_profiles cp ON cp.user_id = u.id
     LEFT JOIN reviews r ON r.coach_id = u.id
     WHERE u.id = $1
     GROUP BY u.id, cp.user_id`,
    [coachId],
  );

  return result.rows[0] || null;
};

const getCoachAvailability = async (coachId) => {
  const result = await db.query(
    `SELECT * FROM coach_availability
     WHERE coach_id = $1
     ORDER BY weekday ASC, start_time ASC`,
    [coachId],
  );
  return result.rows;
};

const addCoachAvailability = async (coachId, slot) => {
  const result = await db.query(
    `INSERT INTO coach_availability (coach_id, weekday, start_time, end_time)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [coachId, slot.weekday, slot.startTime, slot.endTime],
  );
  return result.rows[0];
};

const getCoachBookings = async (coachId) => {
  const result = await db.query(
    `SELECT
      b.*,
      p.full_name AS player_name,
      c.name AS court_name
     FROM bookings b
     JOIN users p ON p.id = b.player_id
     JOIN courts c ON c.id = b.court_id
     WHERE b.coach_id = $1 AND b.status = 'confirmed'
     ORDER BY b.booking_date ASC, b.start_time ASC`,
    [coachId],
  );

  return result.rows;
};

module.exports = {
  addCoachAvailability,
  getCoachAvailability,
  getCoachBookings,
  getCoachById,
  searchCoaches,
};
