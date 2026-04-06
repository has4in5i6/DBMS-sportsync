import { request } from './api';

export const fetchCourts = (query = '') => request(`/courts${query}`);
export const fetchCoaches = (query = '') => request(`/coaches${query}`);
export const fetchCourtById = (courtId) => request(`/courts/${courtId}`);
export const fetchCoachById = (coachId) => request(`/coaches/${coachId}`);
