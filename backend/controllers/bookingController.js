const { getCoachAvailability, getCoachById } = require('../models/coachModel');
const { getCourtAvailability, getCourtById } = require('../models/courtModel');
const {
  cancelBooking,
  createBooking,
  getCoachBookings,
  getOwnerBookings,
  getPlayerBookings,
  listConflictingBookings,
} = require('../models/bookingModel');
const { durationInHours, slotContains, toMinutes, weekdayFromDate } = require('../utils/timeUtils');

const validateAvailability = async ({ bookingDate, startTime, endTime, courtId, coachId }) => {
  const weekday = weekdayFromDate(bookingDate);
  const courtSlots = await getCourtAvailability(courtId);
  const matchingCourtSlot = courtSlots.find((slot) => (
    slot.weekday === weekday && slotContains(slot.start_time, slot.end_time, startTime, endTime)
  ));

  if (!matchingCourtSlot) {
    return 'Selected court is not available in that time slot.';
  }

  if (coachId) {
    const coachSlots = await getCoachAvailability(coachId);
    const matchingCoachSlot = coachSlots.find((slot) => (
      slot.weekday === weekday && slotContains(slot.start_time, slot.end_time, startTime, endTime)
    ));

    if (!matchingCoachSlot) {
      return 'Selected coach is not available in that time slot.';
    }
  }

  return null;
};

const createNewBooking = async (req, res, next) => {
  try {
    if (req.session.user.role !== 'player') {
      return res.status(403).json({ message: 'Only players can create bookings.' });
    }

    const { courtId, coachId, bookingDate, startTime, endTime, notes } = req.body;
    if (!courtId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Court, date, start time, and end time are required.' });
    }

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const court = await getCourtById(courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found.' });
    }

    let coach = null;
    if (coachId) {
      coach = await getCoachById(coachId);
      if (!coach) {
        return res.status(404).json({ message: 'Coach not found.' });
      }
      if (coach.primary_sport !== court.sport_type) {
        return res.status(400).json({ message: 'Coach sport and court sport must match.' });
      }
    }

    const availabilityError = await validateAvailability({
      bookingDate,
      startTime,
      endTime,
      courtId,
      coachId,
    });
    if (availabilityError) {
      return res.status(409).json({ message: availabilityError });
    }

    const conflicts = await listConflictingBookings({
      bookingDate,
      startTime,
      endTime,
      courtId,
      coachId,
      playerId: req.session.user.id,
    });

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Booking conflicts with an existing court, coach, or player schedule.' });
    }

    const duration = durationInHours(startTime, endTime);
    const totalPrice = Number(court.price_per_hour) * duration + (coach ? Number(coach.hourly_rate) * duration : 0);
    const booking = await createBooking({
      playerId: req.session.user.id,
      courtId,
      coachId,
      bookingDate,
      startTime,
      endTime,
      totalPrice,
      notes,
    });

    return res.status(201).json({ booking });
  } catch (error) {
    return next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await getPlayerBookings(req.session.user.id);
    return res.json({ bookings });
  } catch (error) {
    return next(error);
  }
};

const getOwnerManagedBookings = async (req, res, next) => {
  try {
    const bookings = await getOwnerBookings(req.session.user.id);
    return res.json({ bookings });
  } catch (error) {
    return next(error);
  }
};

const getCoachManagedBookings = async (req, res, next) => {
  try {
    const bookings = await getCoachBookings(req.session.user.id);
    return res.json({ bookings });
  } catch (error) {
    return next(error);
  }
};

const cancelExistingBooking = async (req, res, next) => {
  try {
    const booking = await cancelBooking(req.params.bookingId, req.session.user.id, req.session.user.role);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    return res.json({ booking });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  cancelExistingBooking,
  createNewBooking,
  getCoachManagedBookings,
  getMyBookings,
  getOwnerManagedBookings,
};
