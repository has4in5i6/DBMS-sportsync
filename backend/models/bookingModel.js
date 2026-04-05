const db = require('../db');

exports.addBooking = async ({ userId, courtId, coachId, startTime, endTime }) => {
  const result = await db.query(
    'INSERT INTO bookings (user_id, court_id, coach_id, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [userId, courtId, coachId, startTime, endTime],
  );
  return { id: result.rows[0].id, userId, courtId, coachId, startTime, endTime };
};

exports.fetchBookings = async (userId) => {
  const result = await db.query('SELECT * FROM bookings WHERE user_id = $1', [userId]);
  return result.rows;
};

exports.removeBooking = async (bookingId) => {
  await db.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
};

exports.fetchCoachSchedule = async (coachId) => {
  const result = await db.query('SELECT * FROM bookings WHERE coach_id = $1', [coachId]);
  return result.rows;
};
