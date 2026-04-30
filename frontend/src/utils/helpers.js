export const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const formatParts = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? '-' : formatParts(value);
  }

  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00Z`)
    : new Date(raw);

  return Number.isNaN(date.getTime()) ? '-' : formatParts(date);
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
