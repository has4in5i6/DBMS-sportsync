const toMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};

const overlaps = (startA, endA, startB, endB) => (
  toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB)
);

const slotContains = (slotStart, slotEnd, candidateStart, candidateEnd) => (
  toMinutes(slotStart) <= toMinutes(candidateStart)
  && toMinutes(slotEnd) >= toMinutes(candidateEnd)
);

const durationInHours = (startTime, endTime) => (
  (toMinutes(endTime) - toMinutes(startTime)) / 60
);

const minutesToTime = (value) => {
  const hours = String(Math.floor(value / 60)).padStart(2, '0');
  const minutes = String(value % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const weekdayFromDate = (dateString) => {
  const day = new Date(`${dateString}T00:00:00`).getDay();
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
