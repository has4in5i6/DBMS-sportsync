export const formatDate = (value) => {
  if (!value) {
    return '-';
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString();
};

export const formatTime = (value) => value?.slice(0, 5) || '-';

export const buildQuery = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};
