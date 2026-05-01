import { request } from './api';

export const createBooking = (payload) => request('/bookings', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const fetchBookingAvailability = (query = '') => request(`/bookings/availability${query}`);
export const recordBookingInterest = (payload) => request('/bookings/interest', {
  method: 'POST',
  body: JSON.stringify(payload),
});
export const fetchMyBookings = () => request('/bookings/mine');
export const fetchOwnerBookings = () => request('/bookings/owner');
export const fetchCoachBookings = () => request('/bookings/coach');

export const cancelBooking = (bookingId) => request(`/bookings/${bookingId}/cancel`, {
  method: 'PATCH',
});
