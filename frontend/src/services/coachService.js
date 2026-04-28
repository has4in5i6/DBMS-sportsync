import { request } from './api';

export const fetchCoachDashboard = () => request('/coaches/me/dashboard');
export const addCoachAvailability = (payload) => request('/coaches/me/availability', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const deleteCoachAvailability = (availabilityId) => request(`/coaches/me/availability/${availabilityId}`, {
  method: 'DELETE',
});
