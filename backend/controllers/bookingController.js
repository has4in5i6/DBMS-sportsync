const { addBooking, fetchBookings, removeBooking, fetchCoachSchedule } = require('../models/bookingModel');

exports.createBooking = async (req, res) => {
  const booking = await addBooking(req.body);
  res.status(201).json({ booking });
};

exports.getBookings = async (req, res) => {
  const bookings = await fetchBookings(req.user.id);
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
