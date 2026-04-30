import { request } from './api';

export const fetchCoaches = (query = '') => request(`/coaches${query}`);
export const fetchCoachById = (coachId) => request(`/coaches/${coachId}`);
export const fetchCoachDashboard = () => request('/coaches/me/dashboard');
export const addCoachAvailability = (payload) => request('/coaches/me/availability', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const deleteCoachAvailability = (availabilityId) => request(`/coaches/me/availability/${availabilityId}`, {
  method: 'DELETE',
});
