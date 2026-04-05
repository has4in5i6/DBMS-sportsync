import { request } from './api';

export const login = (credentials) => request('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials),
});

export const signup = (data) => request('/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// TODO: Implement logout function
// export const logout = () => request('/auth/logout', { method: 'POST' });

// TODO: Implement check login status
// export const checkLogin = () => request('/auth/isLoggedIn');
