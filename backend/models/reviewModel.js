const db = require('../db');

const createReview = async ({ reviewerId, coachId, courtId, rating, comment }) => {
  const result = await db.query(
    `INSERT INTO reviews (reviewer_id, coach_id, court_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [reviewerId, coachId || null, courtId || null, rating, comment || ''],
  );

  return result.rows[0];
};

const getReviews = async ({ coachId, courtId }) => {
  const params = [];
  const conditions = [];

  if (coachId) {
    params.push(coachId);
    conditions.push(`r.coach_id = $${params.length}`);
  }

  if (courtId) {
    params.push(courtId);
    conditions.push(`r.court_id = $${params.length}`);
  }

  const result = await db.query(
    `SELECT
      r.*,
      reviewer.full_name AS reviewer_name
     FROM reviews r
     JOIN users reviewer ON reviewer.id = r.reviewer_id
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY r.created_at DESC`,
    params,
  );

  return result.rows;
};

const getReviewTargetsForUser = async (userId) => {
  const [courtsResult, coachesResult] = await Promise.all([
    db.query(
      `SELECT DISTINCT
        c.id,
        c.name
       FROM bookings b
       JOIN courts c ON c.id = b.court_id
       WHERE b.player_id = $1
         AND b.status = 'confirmed'
         AND b.booking_date <= CURRENT_DATE
       ORDER BY c.name ASC`,
      [userId],
    ),
    db.query(
      `SELECT DISTINCT
        u.id,
        u.full_name
       FROM bookings b
       JOIN users u ON u.id = b.coach_id
       WHERE b.player_id = $1
         AND b.coach_id IS NOT NULL
         AND b.status = 'confirmed'
         AND b.booking_date <= CURRENT_DATE
       ORDER BY u.full_name ASC`,
      [userId],
    ),
  ]);

  return {
    courts: courtsResult.rows,
    coaches: coachesResult.rows,
  };
};

const hasUserBookedCourt = async ({ userId, courtId }) => {
  const result = await db.query(
    `SELECT 1
     FROM bookings
     WHERE player_id = $1
       AND court_id = $2
       AND status = 'confirmed'
       AND booking_date <= CURRENT_DATE
     LIMIT 1`,
    [userId, courtId],
  );

  return result.rowCount > 0;
};

const hasUserBookedCoach = async ({ userId, coachId }) => {
  const result = await db.query(
    `SELECT 1
     FROM bookings
     WHERE player_id = $1
       AND coach_id = $2
       AND status = 'confirmed'
       AND booking_date <= CURRENT_DATE
     LIMIT 1`,
    [userId, coachId],
  );

  return result.rowCount > 0;
};

module.exports = {
  createReview,
  getReviews,
  getReviewTargetsForUser,
  hasUserBookedCoach,
  hasUserBookedCourt,
};
