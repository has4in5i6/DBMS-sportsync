const db = require('../db');

exports.addBooking = async ({ userId, courtId, coachId, startTime, endTime }) => {
  const [result] = await db.query(
    'INSERT INTO bookings (user_id, court_id, coach_id, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
    [userId, courtId, coachId, startTime, endTime],
  );
  return { id: result.insertId, userId, courtId, coachId, startTime, endTime };
};

exports.fetchBookings = async (userId) => {
  const [rows] = await db.query('SELECT * FROM bookings WHERE user_id = ?', [userId]);
  return rows;
};

exports.removeBooking = async (bookingId) => {
  await db.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
};

exports.fetchCoachSchedule = async (coachId) => {
  const [rows] = await db.query('SELECT * FROM bookings WHERE coach_id = ?', [coachId]);
  return rows;
};
