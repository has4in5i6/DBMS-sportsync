const db = require('../db');

const searchCourts = async ({ sportType, city, maxPrice }) => {
  const params = [];
  const conditions = ['c.is_active = TRUE'];

  if (sportType) {
    params.push(sportType);
    conditions.push(`c.sport_type = $${params.length}`);
  }

  if (city) {
    params.push(`%${city}%`);
    conditions.push(`c.location ILIKE $${params.length}`);
  }

  if (maxPrice) {
    params.push(maxPrice);
    conditions.push(`c.price_per_hour <= $${params.length}`);
  }

  const result = await db.query(
    `SELECT
      c.*,
      u.full_name AS owner_name,
      COALESCE(AVG(r.rating), 0)::numeric(10,2) AS average_rating,
      COUNT(r.id)::int AS review_count
     FROM courts c
     JOIN users u ON u.id = c.owner_id
     LEFT JOIN reviews r ON r.court_id = c.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY c.id, u.full_name
     ORDER BY c.price_per_hour ASC, c.name ASC`,
    params,
  );

  return result.rows;
};

const getCourtById = async (courtId) => {
  const result = await db.query(
    `SELECT
      c.*,
      u.full_name AS owner_name,
      COALESCE(AVG(r.rating), 0)::numeric(10,2) AS average_rating,
      COUNT(r.id)::int AS review_count
     FROM courts c
     JOIN users u ON u.id = c.owner_id
     LEFT JOIN reviews r ON r.court_id = c.id
     WHERE c.id = $1
     GROUP BY c.id, u.full_name`,
    [courtId],
  );

  return result.rows[0] || null;
};

const listOwnerCourts = async (ownerId) => {
  const result = await db.query(
    'SELECT * FROM courts WHERE owner_id = $1 ORDER BY name ASC',
    [ownerId],
  );
  return result.rows;
};

const createCourt = async (ownerId, court) => {
  const result = await db.query(
    `INSERT INTO courts (
      owner_id,
      name,
      sport_type,
      location,
      surface,
      price_per_hour,
      capacity,
      description
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      ownerId,
      court.name,
      court.sportType,
      court.location,
      court.surface,
      court.pricePerHour,
      court.capacity,
      court.description,
    ],
  );

  return result.rows[0];
};

const updateCourt = async (ownerId, courtId, court) => {
  const result = await db.query(
    `UPDATE courts
     SET name = $1,
         sport_type = $2,
         location = $3,
         surface = $4,
         price_per_hour = $5,
         capacity = $6,
         description = $7,
         is_active = $8
     WHERE id = $9 AND owner_id = $10
     RETURNING *`,
    [
      court.name,
      court.sportType,
      court.location,
      court.surface,
      court.pricePerHour,
      court.capacity,
      court.description,
      court.isActive,
      courtId,
      ownerId,
    ],
  );

  return result.rows[0] || null;
};

const deleteCourt = async (ownerId, courtId) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const ownedCourt = await client.query(
      'SELECT id FROM courts WHERE id = $1 AND owner_id = $2',
      [courtId, ownerId],
    );

    if (!ownedCourt.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('DELETE FROM court_availability WHERE court_id = $1', [courtId]);
    await client.query('DELETE FROM bookings WHERE court_id = $1', [courtId]);
    const result = await client.query(
      'DELETE FROM courts WHERE id = $1 AND owner_id = $2 RETURNING *',
      [courtId, ownerId],
    );
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getCourtAvailability = async (courtId) => {
  const result = await db.query(
    `SELECT * FROM court_availability
     WHERE court_id = $1
     ORDER BY weekday ASC, start_time ASC`,
    [courtId],
  );
  return result.rows;
};

const addCourtAvailability = async (courtId, slot) => {
  const result = await db.query(
    `INSERT INTO court_availability (court_id, weekday, start_time, end_time)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [courtId, slot.weekday, slot.startTime, slot.endTime],
  );
  return result.rows[0];
};

const deleteCourtAvailability = async (ownerId, courtId, availabilityId) => {
  const result = await db.query(
    `DELETE FROM court_availability ca
     USING courts c
     WHERE ca.id = $1
       AND ca.court_id = $2
       AND c.id = ca.court_id
       AND c.owner_id = $3
     RETURNING ca.*`,
    [availabilityId, courtId, ownerId],
  );

  return result.rows[0] || null;
};

module.exports = {
  addCourtAvailability,
  createCourt,
  deleteCourtAvailability,
  deleteCourt,
  getCourtAvailability,
  getCourtById,
  listOwnerCourts,
  searchCourts,
  updateCourt,
};
