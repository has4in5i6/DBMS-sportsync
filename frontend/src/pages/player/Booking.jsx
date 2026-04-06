import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { cancelBooking, createBooking, fetchMyBookings } from '../../services/bookingService';
import { fetchCoaches, fetchCourts } from '../../services/searchService';
import { formatDate, formatTime } from '../../utils/helpers';

export default function Booking() {
  const [courts, setCourts] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    courtId: '',
    coachId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const loadPage = async () => {
    try {
      const [courtData, coachData, bookingData] = await Promise.all([
        fetchCourts(),
        fetchCoaches(),
        fetchMyBookings(),
      ]);
      setCourts(courtData.courts);
      setCoaches(coachData.coaches);
      setBookings(bookingData.bookings);
      if (!form.courtId && courtData.courts[0]) {
        setForm((current) => ({ ...current, courtId: String(courtData.courts[0].id) }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await createBooking({
        ...form,
        courtId: Number(form.courtId),
        coachId: form.coachId ? Number(form.coachId) : null,
      });
      setMessage('Booking created successfully.');
      setForm((current) => ({ ...current, coachId: '', bookingDate: '', startTime: '', endTime: '', notes: '' }));
      loadPage();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await cancelBooking(bookingId);
      loadPage();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-shell">
      <div className="dashboard-grid">
        <Card title="Create booking" subtitle="Choose a court, optional coach, and an available time slot.">
          <form className="grid-form" onSubmit={handleSubmit}>
            <Input
              label="Court"
              as="select"
              name="courtId"
              value={form.courtId}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select a court' },
                ...courts.map((court) => ({ value: String(court.id), label: `${court.name} - ${court.sport_type}` })),
              ]}
              required
            />
            <Input
              label="Coach (optional)"
              as="select"
              name="coachId"
              value={form.coachId}
              onChange={handleChange}
              options={[
                { value: '', label: 'No coach' },
                ...coaches.map((coach) => ({ value: String(coach.id), label: `${coach.full_name} - ${coach.primary_sport}` })),
              ]}
            />
            <Input label="Booking date" type="date" name="bookingDate" value={form.bookingDate} onChange={handleChange} required />
            <Input label="Start time" type="time" name="startTime" value={form.startTime} onChange={handleChange} required />
            <Input label="End time" type="time" name="endTime" value={form.endTime} onChange={handleChange} required />
            <Input label="Notes" as="textarea" name="notes" value={form.notes} onChange={handleChange} rows="4" />
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            <Button type="submit">Book now</Button>
          </form>
        </Card>

        <Card title="My bookings" subtitle="Sessions you have reserved so far.">
          {bookings.map((booking) => (
            <div className="list-item" key={booking.id}>
              <strong>{booking.court_name}</strong>
              <span>{formatDate(booking.booking_date)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
              <span>{booking.coach_name ? `Coach: ${booking.coach_name}` : 'Court-only booking'} • Status: {booking.status}</span>
              {booking.status === 'confirmed' && (
                <Button variant="ghost" onClick={() => handleCancel(booking.id)}>Cancel</Button>
              )}
            </div>
          ))}
          {bookings.length === 0 && <p>No bookings yet.</p>}
        </Card>
      </div>
    </div>
  );
}
