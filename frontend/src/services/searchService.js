import { request } from './api';

export const searchCourts = () => request('/courts');
export const getCourt = (courtId) => request(`/courts/${courtId}`);
