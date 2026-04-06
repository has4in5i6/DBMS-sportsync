import { request } from './api';

export const fetchMe = () => request('/users/me');
export const updateMe = (payload) => request('/users/me', {
  method: 'PUT',
  body: JSON.stringify(payload),
});
export const fetchOverview = () => request('/users/me/overview');
