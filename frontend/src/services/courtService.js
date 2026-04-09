import { request } from './api';

export const fetchOwnerCourts = () => request('/courts/owner/mine');

export const createCourt = (payload) => request('/courts', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const updateCourt = (courtId, payload) => request(`/courts/${courtId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

export const deleteCourt = (courtId) => request(`/courts/${courtId}`, {
  method: 'DELETE',
});

export const addCourtAvailability = (courtId, payload) => request(`/courts/${courtId}/availability`, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const removeCourtAvailability = (courtId, availabilityId) => request(`/courts/${courtId}/availability/${availabilityId}`, {
  method: 'DELETE',
});
