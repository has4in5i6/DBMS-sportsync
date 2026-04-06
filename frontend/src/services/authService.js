import { request } from './api';

export const login = (credentials) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
});

export const signup = (payload) => request('/auth/signup', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const logout = () => request('/auth/logout', {
  method: 'POST',
});

export const fetchSession = () => request('/auth/session');
