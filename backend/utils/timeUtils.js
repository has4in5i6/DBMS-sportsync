exports.hasConflict = (existingBookings, candidate) => {
  return existingBookings.some((booking) => {
    return (
      candidate.startTime < booking.end_time && candidate.endTime > booking.start_time
    );
  });
};
