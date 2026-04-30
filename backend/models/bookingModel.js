const db = require('../db');

const listConflictingBookings = async ({
  bookingDate,
  startTime,
  endTime,
  courtId,
  coachId,
  playerId,
  queryable = db,
}) => {
  const params = [bookingDate, startTime, endTime, courtId];
  const scopeChecks = ['court_id = $4'];

  if (coachId) {
    params.push(coachId);
    scopeChecks.push(`coach_id = $${params.length}`);
  }

  if (playerId) {
    params.push(playerId);
    scopeChecks.push(`player_id = $${params.length}`);
  }

  const result = await queryable.query(
    `SELECT *
     FROM bookings
     WHERE booking_date = $1
       AND status = 'confirmed'
       AND start_time < $3
       AND end_time > $2
       AND (${scopeChecks.join(' OR ')})`,
    params,
  );

  return result.rows;
};

const createBooking = async ({
  playerId,
  courtId,
  coachId,
  bookingDate,
  startTime,
  endTime,
  totalPrice,
  notes,
}) => {
  const result = await db.query(
    `INSERT INTO bookings (
      player_id,
      court_id,
      coach_id,
      booking_date,
      start_time,
      end_time,
      total_price,
      notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [playerId || null, courtId, coachId || null, bookingDate, startTime, endTime, totalPrice, notes || ''],
  );

  return result.rows[0];
};

const createBookingWithTransaction = async ({
  playerId,
  courtId,
  coachId,
  bookingDate,
  startTime,
  endTime,
  totalPrice,
  notes,
}) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Lock the resources involved so overlapping bookings on the same court, player,
    // or coach are serialized before we re-check conflicts and insert.
    await client.query('SELECT id FROM courts WHERE id = $1 FOR UPDATE', [courtId]);
    if (playerId) {
      await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [playerId]);
    }

    if (coachId) {
      await client.query('SELECT user_id FROM coach_profiles WHERE user_id = $1 FOR UPDATE', [coachId]);
    }

    const conflicts = await listConflictingBookings({
      bookingDate,
      startTime,
      endTime,
      courtId,
      coachId,
      playerId,
      queryable: client,
    });

    if (conflicts.length > 0) {
      const error = new Error('Booking conflicts with an existing court, coach, or player schedule.');
      error.status = 409;
      throw error;
    }

    const result = await client.query(
      `INSERT INTO bookings (
        player_id,
        court_id,
        coach_id,
        booking_date,
        start_time,
        end_time,
        total_price,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [playerId || null, courtId, coachId || null, bookingDate, startTime, endTime, totalPrice, notes || ''],
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getPlayerBookings = async (playerId) => {
  const result = await db.query(
    `SELECT
     b.*,
      c.name AS court_name,
      c.location AS court_location,
      coach.full_name AS coach_name
     FROM bookings b
     JOIN courts c ON c.id = b.court_id
     LEFT JOIN users coach ON coach.id = b.coach_id
     WHERE b.player_id = $1
       AND b.status = 'confirmed'
     ORDER BY b.booking_date ASC, b.start_time ASC`,
    [playerId],
  );

  return result.rows;
};

const getOwnerBookings = async (ownerId) => {
  const result = await db.query(
    `SELECT
      b.*,
      c.name AS court_name,
      p.full_name AS player_name,
      coach.full_name AS coach_name
     FROM bookings b
     JOIN courts c ON c.id = b.court_id
     LEFT JOIN users p ON p.id = b.player_id
     LEFT JOIN users coach ON coach.id = b.coach_id
     WHERE c.owner_id = $1
     ORDER BY b.booking_date ASC, b.start_time ASC`,
    [ownerId],
  );

  return result.rows;
};

const getCoachBookings = async (coachId) => {
  const result = await db.query(
    `SELECT
     b.*,
      c.name AS court_name,
      p.full_name AS player_name
     FROM bookings b
     JOIN courts c ON c.id = b.court_id
     LEFT JOIN users p ON p.id = b.player_id
     WHERE b.coach_id = $1
       AND b.status = 'confirmed'
     ORDER BY b.booking_date ASC, b.start_time ASC`,
    [coachId],
  );

  return result.rows;
};

const getCourtBookingsForDate = async (courtId, bookingDate) => {
  const result = await db.query(
    `SELECT start_time, end_time
     FROM bookings
     WHERE court_id = $1
       AND booking_date = $2
       AND status = 'confirmed'
     ORDER BY start_time ASC`,
    [courtId, bookingDate],
  );

  return result.rows;
};

const getCoachBookingsForDate = async (bookingDate, coachIds) => {
  if (!coachIds.length) {
    return [];
  }

  const result = await db.query(
    `SELECT coach_id, start_time, end_time
     FROM bookings
     WHERE booking_date = $1
       AND status = 'confirmed'
       AND coach_id = ANY($2::int[])
     ORDER BY coach_id ASC, start_time ASC`,
    [bookingDate, coachIds],
  );

  return result.rows;
};

const cancelBooking = async (bookingId, userId, role) => {
  let query = `
    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = $1
  `;
  const params = [bookingId];

  if (role === 'player') {
    query += ' AND player_id = $2';
    params.push(userId);
  } else if (role === 'coach') {
    query += ' AND coach_id = $2 AND player_id IS NULL';
    params.push(userId);
  } else if (role === 'owner') {
    query += ` AND EXISTS (
      SELECT 1
      FROM courts c
      WHERE c.id = bookings.court_id
        AND c.owner_id = $2
    )`;
    params.push(userId);
  }

  query += ' RETURNING *';

  const result = await db.query(query, params);
  return result.rows[0] || null;
};

module.exports = {
  cancelBooking,
  createBooking,
  createBookingWithTransaction,
  getCoachBookingsForDate,
  getCoachBookings,
  getCourtBookingsForDate,
  getOwnerBookings,
  getPlayerBookings,
  listConflictingBookings,
};
