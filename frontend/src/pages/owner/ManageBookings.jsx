import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import { fetchOwnerBookings } from '../../services/bookingService';
import { formatDate, formatTime } from '../../utils/helpers';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOwnerBookings()
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page-shell">
      <Card title="Facility bookings" subtitle="All reservations across courts you own.">
        {error && <p className="form-error">{error}</p>}
        {bookings.map((booking) => (
          <div className="list-item" key={booking.id}>
            <strong>{booking.court_name}</strong>
            <span>Player: {booking.player_name}</span>
            <span>{booking.coach_name ? `Coach: ${booking.coach_name}` : 'Court-only booking'}</span>
            <span>{formatDate(booking.booking_date)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
          </div>
        ))}
        {bookings.length === 0 && !error && <p>No bookings for your courts yet.</p>}
      </Card>
    </div>
  );
}
