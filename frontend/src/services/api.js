const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, options);
  return response.json();
};
