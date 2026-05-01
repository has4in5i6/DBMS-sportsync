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

const normalizeDateOnly = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    if (Number.isNaN(time)) {
      return null;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const raw = String(value).trim();
  const matchedDate = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return matchedDate ? matchedDate[1] : null;
};

const getBookingBoundary = (booking, timeKey) => {
  const bookingDate = normalizeDateOnly(booking?.booking_date);
  const boundaryTime = booking?.[timeKey] ? String(booking[timeKey]).slice(0, 8) : null;

  if (!bookingDate || !boundaryTime) {
    return null;
  }

  const boundary = new Date(`${bookingDate}T${boundaryTime}`);
  return Number.isNaN(boundary.getTime()) ? null : boundary;
};

export const getBookingLifecycle = (booking) => {
  if (booking?.status === 'cancelled') {
    return 'cancelled';
  }

  const bookingEnd = getBookingBoundary(booking, 'end_time');
  if (bookingEnd && bookingEnd < new Date()) {
    return 'completed';
  }

  return 'upcoming';
};

export const getBookingDisplayStatus = (booking) => (
  getBookingLifecycle(booking) === 'completed' ? 'completed' : booking?.status || '-'
);

export const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${formatDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

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
