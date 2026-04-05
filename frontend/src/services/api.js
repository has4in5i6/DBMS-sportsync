const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'; // Updated to match backend port

// TODO: Add proper error handling and status code checks
// TODO: Include credentials for session-based auth
export const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // For session cookies
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};
