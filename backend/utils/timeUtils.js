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

module.exports = {
  durationInHours,
  minutesToTime,
  overlaps,
  slotContains,
  toMinutes,
  weekdayFromDate,
};
