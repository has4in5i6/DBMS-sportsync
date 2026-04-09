const { getCoachAvailability, getCoachById, searchCoaches } = require('../models/coachModel');
const { getCourtAvailability, getCourtById } = require('../models/courtModel');
const {
  cancelBooking,
  createBooking,
  getCoachBookingsForDate,
  getCoachBookings,
  getCourtBookingsForDate,
  getOwnerBookings,
  getPlayerBookings,
  listConflictingBookings,
} = require('../models/bookingModel');
const {
  durationInHours,
  minutesToTime,
  overlaps,
  toMinutes,
  weekdayFromDate,
} = require('../utils/timeUtils');

const formatSlot = (slot) => ({
  weekday: slot.weekday,
  startTime: slot.start_time.slice(0, 5),
  endTime: slot.end_time.slice(0, 5),
});

const buildBookableSlots = (availabilityRows, bookingRows, weekday) => {
  const generatedSlots = [];

  availabilityRows
    .filter((slot) => slot.weekday === weekday)
    .forEach((slot) => {
      const startMinutes = toMinutes(slot.start_time);
      const endMinutes = toMinutes(slot.end_time);

      // Generate one-hour slots every 30 minutes so coach and court windows can intersect cleanly.
      for (let cursor = startMinutes; cursor + 60 <= endMinutes; cursor += 30) {
        const slotStart = minutesToTime(cursor);
        const slotEnd = minutesToTime(cursor + 60);
        const hasConflict = bookingRows.some((booking) => (
          overlaps(slotStart, slotEnd, booking.start_time, booking.end_time)
        ));

        if (!hasConflict) {
          generatedSlots.push({
            weekday,
            startTime: slotStart,
            endTime: slotEnd,
          });
        }
      }
    });

  return generatedSlots;
};

const validateAvailability = async ({ bookingDate, startTime, endTime, courtId, coachId }) => {
  const weekday = weekdayFromDate(bookingDate);
  const [courtSlots, courtBookings] = await Promise.all([
    getCourtAvailability(courtId),
    getCourtBookingsForDate(courtId, bookingDate),
  ]);
  const generatedCourtSlots = buildBookableSlots(courtSlots, courtBookings, weekday);
  const matchingCourtSlot = generatedCourtSlots.find((slot) => (
    slot.startTime === startTime && slot.endTime === endTime
  ));

  if (!matchingCourtSlot) {
    return 'Selected court is not available in that time slot.';
  }

  if (coachId) {
    const [coachSlots, coachBookings] = await Promise.all([
      getCoachAvailability(coachId),
      getCoachBookingsForDate(bookingDate, [Number(coachId)]),
    ]);
    const generatedCoachSlots = buildBookableSlots(coachSlots, coachBookings, weekday);
    const matchingCoachSlot = generatedCoachSlots.find((slot) => (
      slot.startTime === startTime && slot.endTime === endTime
    ));

    if (!matchingCoachSlot) {
      return 'Selected coach is not available in that time slot.';
    }
  }

  return null;
};

const getBookingAvailability = async (req, res, next) => {
  try {
    const { courtId, bookingDate } = req.query;

    if (!courtId || !bookingDate) {
      return res.status(400).json({ message: 'Court and booking date are required.' });
    }

    const court = await getCourtById(courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found.' });
    }

    const weekday = weekdayFromDate(bookingDate);
    if (weekday === null) {
      return res.status(400).json({ message: 'Invalid booking date.' });
    }

    const [courtAvailability, courtBookings, matchingCoaches] = await Promise.all([
      getCourtAvailability(courtId),
      getCourtBookingsForDate(courtId, bookingDate),
      searchCoaches({ sport: court.sport_type }),
    ]);

    const availableCourtSlots = buildBookableSlots(courtAvailability, courtBookings, weekday);

    const coachIds = matchingCoaches.map((coach) => coach.id);
    const [coachAvailabilityRows, coachBookings] = await Promise.all([
      Promise.all(coachIds.map((coachId) => getCoachAvailability(coachId))),
      getCoachBookingsForDate(bookingDate, coachIds),
    ]);

    const bookingsByCoach = coachBookings.reduce((accumulator, booking) => {
      accumulator[booking.coach_id] ||= [];
      accumulator[booking.coach_id].push(booking);
      return accumulator;
    }, {});

    const coaches = matchingCoaches.map((coach, index) => {
      const availableSlots = buildBookableSlots(
        coachAvailabilityRows[index],
        bookingsByCoach[coach.id] || [],
        weekday,
      );

      return {
        ...coach,
        availableSlots,
      };
    }).filter((coach) => coach.availableSlots.length > 0);

    const availableWeekdays = [...new Set(courtAvailability.map((slot) => slot.weekday))].sort((a, b) => a - b);

    return res.json({
      court,
      bookingDate,
      availableWeekdays,
      availableCourtSlots,
      coaches,
    });
  } catch (error) {
    return next(error);
  }
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
  getBookingAvailability,
  getCoachManagedBookings,
  getMyBookings,
  getOwnerManagedBookings,
};
