const toMinutes = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return (value.getHours() * 60) + value.getMinutes();
  }

  const normalized = String(value).trim();
  const [hours, minutes] = normalized.split(':').map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return (hours * 60) + minutes;
};

const overlaps = (startA, endA, startB, endB) => {
  const startAMins = toMinutes(startA);
  const endAMins = toMinutes(endA);
  const startBMins = toMinutes(startB);
  const endBMins = toMinutes(endB);

  if ([startAMins, endAMins, startBMins, endBMins].some((minute) => minute === null)) {
    return false;
  }

  return startAMins < endBMins && endAMins > startBMins;
};

const slotContains = (slotStart, slotEnd, candidateStart, candidateEnd) => {
  const slotStartMins = toMinutes(slotStart);
  const slotEndMins = toMinutes(slotEnd);
  const candidateStartMins = toMinutes(candidateStart);
  const candidateEndMins = toMinutes(candidateEnd);

  if ([slotStartMins, slotEndMins, candidateStartMins, candidateEndMins].some((minute) => minute === null)) {
    return false;
  }

  return slotStartMins <= candidateStartMins && slotEndMins >= candidateEndMins;
};

const durationInHours = (startTime, endTime) => {
  const startMins = toMinutes(startTime);
  const endMins = toMinutes(endTime);
  if (startMins === null || endMins === null) {
    return 0;
  }
  return (endMins - startMins) / 60;
};

const minutesToTime = (value) => {
  const hours = String(Math.floor(value / 60)).padStart(2, '0');
  const minutes = String(value % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const weekdayFromDate = (dateString) => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(String(dateString))) {
    return null;
  }

  const day = new Date(`${dateString}T00:00:00Z`).getUTCDay();
  return Number.isNaN(day) ? null : day;
};

const todayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateOnly = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    if (Number.isNaN(time)) {
      return null;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const raw = String(value).trim();
  const matchedDate = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return matchedDate ? matchedDate[1] : null;
};

const isPastDate = (dateString) => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(String(dateString))) {
    return false;
  }

  return dateString < todayDateString();
};

const bookingStartDateTime = (booking) => {
  const bookingDate = normalizeDateOnly(booking?.booking_date);
  if (!bookingDate || !booking?.start_time) {
    return null;
  }

  const startTime = String(booking.start_time).slice(0, 8);
  const startDateTime = new Date(`${bookingDate}T${startTime}`);
  return Number.isNaN(startDateTime.getTime()) ? null : startDateTime;
};

const isUpcomingConfirmedBooking = (booking) => {
  if (booking?.status !== 'confirmed') {
    return false;
  }

  const startDateTime = bookingStartDateTime(booking);
  return startDateTime !== null && startDateTime >= new Date();
};

const sortBookingsByStartTime = (leftBooking, rightBooking) => {
  const leftStart = bookingStartDateTime(leftBooking);
  const rightStart = bookingStartDateTime(rightBooking);

  if (!leftStart && !rightStart) {
    return 0;
  }

  if (!leftStart) {
    return 1;
  }

  if (!rightStart) {
    return -1;
  }

  return leftStart - rightStart;
};

module.exports = {
  bookingStartDateTime,
  durationInHours,
  isPastDate,
  isUpcomingConfirmedBooking,
  minutesToTime,
  overlaps,
  slotContains,
  sortBookingsByStartTime,
  todayDateString,
  toMinutes,
  weekdayFromDate,
};
