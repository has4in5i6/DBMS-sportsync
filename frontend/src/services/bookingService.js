import { request } from './api';

export const fetchBookings = () => request('/bookings');
export const createBooking = (booking) => request('/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(booking),
});
export const cancelBooking = (bookingId) => request(`/bookings/${bookingId}`, { method: 'DELETE' });
