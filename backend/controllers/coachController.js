const {
  addCoachAvailability,
  deleteCoachAvailability,
  getCoachAvailability,
  getCoachBookings,
  getCoachById,
  searchCoaches,
} = require('../models/coachModel');
const { getReviews } = require('../models/reviewModel');

const listCoaches = async (req, res, next) => {
  try {
    const coaches = await searchCoaches(req.query);
    return res.json({ coaches });
  } catch (error) {
    return next(error);
  }
};

const getCoach = async (req, res, next) => {
  try {
    const coach = await getCoachById(req.params.coachId);
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found.' });
    }

    const availability = await getCoachAvailability(req.params.coachId);
    const reviews = await getReviews({ coachId: req.params.coachId });
    return res.json({ coach, availability, reviews });
  } catch (error) {
    return next(error);
  }
};

const getMyCoachDashboard = async (req, res, next) => {
  try {
    const coach = await getCoachById(req.session.user.id);
    const availability = await getCoachAvailability(req.session.user.id);
    const bookings = await getCoachBookings(req.session.user.id);
    const reviews = await getReviews({ coachId: req.session.user.id });
    return res.json({ coach, availability, bookings, reviews });
  } catch (error) {
    return next(error);
  }
};

const addMyAvailability = async (req, res, next) => {
  try {
    const { weekday, startTime, endTime } = req.body;

    if (weekday === undefined || !startTime || !endTime) {
      return res.status(400).json({ message: 'Weekday, start time, and end time are required.' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const availability = await addCoachAvailability(req.session.user.id, req.body);
    return res.status(201).json({ availability });
  } catch (error) {
    return next(error);
  }
};

const deleteMyAvailability = async (req, res, next) => {
  try {
    const availability = await deleteCoachAvailability(req.session.user.id, req.params.availabilityId);
    if (!availability) {
      return res.status(404).json({ message: 'Availability slot not found.' });
    }

    return res.json({ availability, message: 'Availability slot deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addMyAvailability,
  deleteMyAvailability,
  getCoach,
  getMyCoachDashboard,
  listCoaches,
};
