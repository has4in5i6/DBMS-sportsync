const { getCoachAvailability, getCoachById, searchCoaches } = require('../models/coachModel');
const { getCourtAvailability, getCourtById } = require('../models/courtModel');
const {
  cancelBooking,
  createBookingWithTransaction,
  getCoachBookingsForDate,
  getCoachBookings,
  getCourtBookingsForDate,
  getCourtSlotInterestCount,
  getCourtSlotInterestCounts,
  getOwnerBookings,
  getPlayerBookings,
  incrementCourtSlotInterest,
} = require('../models/bookingModel');
const {
  durationInHours,
  isPastDate,
  minutesToTime,
  overlaps,
  slotContains,
  toMinutes,
  weekdayFromDate,
} = require('../utils/timeUtils');

const DYNAMIC_PRICE_FACTOR = 0.5;

const formatSlot = (slot) => ({
  weekday: slot.weekday,
  startTime: slot.start_time.slice(0, 5),
  endTime: slot.end_time.slice(0, 5),
});

const roundCurrency = (value) => Number(Number(value).toFixed(2));

const buildBookableSlots = (availabilityRows, bookingRows, weekday) => {
  const generatedSlots = [];

  availabilityRows
    .filter((slot) => Number(slot.weekday) === weekday)
    .forEach((slot) => {
      const startMinutes = toMinutes(slot.start_time);
      const endMinutes = toMinutes(slot.end_time);
      if (startMinutes === null || endMinutes === null) {
        return;
      }

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

const getSlotKey = (slot) => `${slot.weekday}-${slot.startTime}-${slot.endTime}`;

const getInterestSlotKey = (startTime, endTime) => `${String(startTime).slice(0, 5)}-${String(endTime).slice(0, 5)}`;

const buildInterestCountMap = (interestRows) => interestRows.reduce((accumulator, row) => {
  accumulator[getInterestSlotKey(row.start_time, row.end_time)] = Number(row.interest_count || 0);
  return accumulator;
}, {});

const calculateDynamicCourtPrice = ({ basePrice, duration = 1, interestCount = 0 }) => (
  roundCurrency(Number(basePrice) * duration * (1 + (DYNAMIC_PRICE_FACTOR * interestCount)))
);

const enrichSlotsWithPricing = (slots, court, interestCountMap) => slots.map((slot) => {
  const interestCount = Number(interestCountMap[getInterestSlotKey(slot.startTime, slot.endTime)] || 0);
  const baseCourtPricePerHour = roundCurrency(Number(court.price_per_hour));
  const dynamicCourtPricePerHour = calculateDynamicCourtPrice({
    basePrice: baseCourtPricePerHour,
    interestCount,
  });

  return {
    ...slot,
    interestCount,
    baseCourtPricePerHour,
    dynamicCourtPricePerHour,
    dynamicCourtPrice: dynamicCourtPricePerHour,
  };
});

const validateAvailability = async ({ bookingDate, startTime, endTime, courtId, coachId }) => {
  const weekday = weekdayFromDate(bookingDate);
  if (weekday === null) {
    return 'Invalid booking date.';
  }

  const [courtSlots, courtBookings] = await Promise.all([
    getCourtAvailability(courtId),
    getCourtBookingsForDate(courtId, bookingDate),
  ]);

  const courtHasWindow = courtSlots.some((slot) => (
    Number(slot.weekday) === weekday && slotContains(slot.start_time, slot.end_time, startTime, endTime)
  ));

  if (!courtHasWindow) {
    return 'Selected court is not available in that time slot.';
  }

  const courtHasConflict = courtBookings.some((booking) => (
    overlaps(startTime, endTime, booking.start_time, booking.end_time)
  ));

  if (courtHasConflict) {
    return 'Selected court is not available in that time slot.';
  }

  if (coachId) {
    const [coachSlots, coachBookings] = await Promise.all([
      getCoachAvailability(coachId),
      getCoachBookingsForDate(bookingDate, [Number(coachId)]),
    ]);

    const coachHasWindow = coachSlots.some((slot) => (
      Number(slot.weekday) === weekday && slotContains(slot.start_time, slot.end_time, startTime, endTime)
    ));

    if (!coachHasWindow) {
      return 'Selected coach is not available in that time slot.';
    }

    const coachBookingsForCoach = coachBookings.filter((booking) => Number(booking.coach_id) === Number(coachId));
    const coachHasConflict = coachBookingsForCoach.some((booking) => (
      overlaps(startTime, endTime, booking.start_time, booking.end_time)
    ));

    if (coachHasConflict) {
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

    if (isPastDate(bookingDate)) {
      return res.status(400).json({ message: 'Booking date cannot be in the past.' });
    }

    const court = await getCourtById(courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found.' });
    }

    const weekday = weekdayFromDate(bookingDate);
    if (weekday === null) {
      return res.status(400).json({ message: 'Invalid booking date.' });
    }

    const [courtAvailability, courtBookings, matchingCoaches, slotInterestRows] = await Promise.all([
      getCourtAvailability(courtId),
      getCourtBookingsForDate(courtId, bookingDate),
      searchCoaches({ sport: court.sport_type }),
      getCourtSlotInterestCounts(courtId, bookingDate),
    ]);

    const interestCountMap = buildInterestCountMap(slotInterestRows);
    const availableCourtSlots = enrichSlotsWithPricing(
      buildBookableSlots(courtAvailability, courtBookings, weekday),
      court,
      interestCountMap,
    );
    const courtSlotKeys = new Set(availableCourtSlots.map(getSlotKey));

    if (req.session.user.role === 'coach') {
      const ownCoachAvailability = await getCoachAvailability(req.session.user.id);
      const ownCoachBookings = await getCoachBookingsForDate(bookingDate, [req.session.user.id]);
      const availableCoachSlots = enrichSlotsWithPricing(
        buildBookableSlots(
          ownCoachAvailability,
          ownCoachBookings,
          weekday,
        ).filter((slot) => courtSlotKeys.has(getSlotKey(slot))),
        court,
        interestCountMap,
      );

      return res.json({
        court,
        bookingDate,
        pricingFactor: DYNAMIC_PRICE_FACTOR,
        availableWeekdays: [...new Set(courtAvailability.map((slot) => Number(slot.weekday)))]
          .filter((value) => !Number.isNaN(value))
          .sort((a, b) => a - b),
        availableCourtSlots: availableCoachSlots,
        coaches: [],
      });
    }

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
      ).filter((slot) => courtSlotKeys.has(getSlotKey(slot)));

      return {
        ...coach,
        availableSlots,
      };
    }).filter((coach) => coach.availableSlots.length > 0);

    const availableWeekdays = [...new Set(courtAvailability.map((slot) => Number(slot.weekday)))]
      .filter((value) => !Number.isNaN(value))
      .sort((a, b) => a - b);

    return res.json({
      court,
      bookingDate,
      pricingFactor: DYNAMIC_PRICE_FACTOR,
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
    if (!['player', 'coach'].includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Only players and coaches can create bookings.' });
    }

    const { courtId, coachId, bookingDate, startTime, endTime, notes } = req.body;
    if (!courtId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Court, date, start time, and end time are required.' });
    }

    if (isPastDate(bookingDate)) {
      return res.status(400).json({ message: 'Booking date cannot be in the past.' });
    }

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const court = await getCourtById(courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found.' });
    }

    const effectiveCoachId = req.session.user.role === 'coach'
      ? req.session.user.id
      : (coachId || null);

    let coach = null;
    if (effectiveCoachId) {
      coach = await getCoachById(effectiveCoachId);
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
      coachId: effectiveCoachId,
    });
    if (availabilityError) {
      return res.status(409).json({ message: availabilityError });
    }

    const duration = durationInHours(startTime, endTime);
    const interestCount = await getCourtSlotInterestCount(courtId, bookingDate, startTime, endTime);
    const courtPrice = calculateDynamicCourtPrice({
      basePrice: Number(court.price_per_hour),
      duration,
      interestCount,
    });
    const totalPrice = courtPrice
      + (req.session.user.role === 'player' && coach ? Number(coach.hourly_rate) * duration : 0);
    const booking = await createBookingWithTransaction({
      playerId: req.session.user.role === 'player' ? req.session.user.id : null,
      courtId,
      coachId: effectiveCoachId,
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

const recordBookingInterest = async (req, res, next) => {
  try {
    const {
      courtId,
      bookingDate,
      startTime,
      endTime,
    } = req.body;

    if (!courtId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Court, date, start time, and end time are required.' });
    }

    if (isPastDate(bookingDate)) {
      return res.status(400).json({ message: 'Booking date cannot be in the past.' });
    }

    const court = await getCourtById(courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found.' });
    }

    const availabilityError = await validateAvailability({
      bookingDate,
      startTime,
      endTime,
      courtId,
      coachId: req.session.user.role === 'coach' ? req.session.user.id : null,
    });
    if (availabilityError) {
      return res.status(409).json({ message: availabilityError });
    }

    const interestRow = await incrementCourtSlotInterest(courtId, bookingDate, startTime, endTime);
    const interestCount = Number(interestRow.interest_count || 0);

    return res.status(201).json({
      slot: {
        startTime: String(interestRow.start_time).slice(0, 5),
        endTime: String(interestRow.end_time).slice(0, 5),
        interestCount,
        baseCourtPricePerHour: roundCurrency(Number(court.price_per_hour)),
        dynamicCourtPricePerHour: calculateDynamicCourtPrice({
          basePrice: Number(court.price_per_hour),
          interestCount,
        }),
        dynamicCourtPrice: calculateDynamicCourtPrice({
          basePrice: Number(court.price_per_hour),
          interestCount,
        }),
      },
      pricingFactor: DYNAMIC_PRICE_FACTOR,
    });
  } catch (error) {
    return next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = req.session.user.role === 'coach'
      ? await getCoachBookings(req.session.user.id)
      : await getPlayerBookings(req.session.user.id);
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
  recordBookingInterest,
};
