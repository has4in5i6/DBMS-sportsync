// TODO: Implement full conflict detection logic
// TODO: Add time slot generation for available times
// TODO: Handle time zones and date formatting

exports.hasConflict = (existingBookings, candidate) => {
  return existingBookings.some((booking) => {
    return (
      candidate.startTime < booking.end_time && candidate.endTime > booking.start_time
    );
  });
};
