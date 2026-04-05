const { addBooking, fetchBookings, removeBooking, fetchCoachSchedule } = require('../models/bookingModel');

exports.createBooking = async (req, res) => {
  // TODO: Add booking conflict detection (check for time overlaps with existing bookings for the same court/coach)
  // TODO: Validate user permissions (e.g., players can book, coaches can only be booked)
  // TODO: Check court/coach availability and capacity
  const booking = await addBooking({ ...req.body, userId: req.session.user.user_id });
  res.status(201).json({ booking });
};

exports.getBookings = async (req, res) => {
  const bookings = await fetchBookings(req.session.user.user_id);
  res.json({ bookings });
};

exports.cancelBooking = async (req, res) => {
  await removeBooking(req.params.bookingId);
  res.status(204).send();
};

exports.getCoachSchedule = async (req, res) => {
  const schedule = await fetchCoachSchedule(req.params.coachId);
  res.json({ schedule });
};
