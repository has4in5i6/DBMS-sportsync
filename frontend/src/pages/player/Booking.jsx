import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { cancelBooking, createBooking, fetchMyBookings } from '../../services/bookingService';
import { fetchCoaches, fetchCourtById, fetchCourts } from '../../services/searchService';
import { formatDate, formatTime } from '../../utils/helpers';

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Booking() {
  const [courts, setCourts] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [courtSlots, setCourtSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    courtId: '',
    slotValue: '',
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

  useEffect(() => {
    const loadCourtSlots = async () => {
      if (!form.courtId) {
        setCourtSlots([]);
        return;
      }

      try {
        setError('');
        const data = await fetchCourtById(form.courtId);
        const availability = data.availability || [];
        setCourtSlots(availability);

        if (availability.length > 0) {
          const firstSlot = availability[0];
          setForm((current) => ({
            ...current,
            slotValue: current.slotValue || `${firstSlot.weekday}-${firstSlot.start_time}-${firstSlot.end_time}`,
            startTime: current.startTime || firstSlot.start_time.slice(0, 5),
            endTime: current.endTime || firstSlot.end_time.slice(0, 5),
          }));
        } else {
          setForm((current) => ({
            ...current,
            slotValue: '',
            startTime: '',
            endTime: '',
          }));
        }
      } catch (err) {
        setError(err.message);
      }
    };

    loadCourtSlots();
  }, [form.courtId]);

  const handleChange = (event) => {
    if (event.target.name === 'slotValue') {
      const selectedSlot = courtSlots.find(
        (slot) => `${slot.weekday}-${slot.start_time}-${slot.end_time}` === event.target.value,
      );

      setForm((current) => ({
        ...current,
        slotValue: event.target.value,
        startTime: selectedSlot ? selectedSlot.start_time.slice(0, 5) : '',
        endTime: selectedSlot ? selectedSlot.end_time.slice(0, 5) : '',
      }));
      return;
    }

    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleCourtSelect = (courtId) => {
    setForm((current) => ({
      ...current,
      courtId: String(courtId),
      slotValue: '',
      startTime: '',
      endTime: '',
    }));
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
      setForm((current) => ({ ...current, coachId: '', bookingDate: '', notes: '' }));
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
        <Card title="Available courts" subtitle="Browse every active court, then lock in the one you want.">
          <div className="selection-grid">
            {courts.map((court) => {
              const isSelected = form.courtId === String(court.id);
              return (
                <button
                  key={court.id}
                  type="button"
                  className={`selection-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleCourtSelect(court.id)}
                >
                  <strong>{court.name}</strong>
                  <span>{court.sport_type} • {court.location}</span>
                  <span>{court.surface} surface • Capacity {court.capacity}</span>
                  <span>Rs. {court.price_per_hour}/hr • Rating {court.average_rating}</span>
                </button>
              );
            })}
          </div>
          {courts.length === 0 && <p>No courts are available right now.</p>}
        </Card>

        <Card title="Create booking" subtitle="Choose your selected court, optional coach, and session time.">
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
              label="Available slot"
              as="select"
              name="slotValue"
              value={form.slotValue}
              onChange={handleChange}
              options={[
                { value: '', label: courtSlots.length > 0 ? 'Select a slot' : 'No slots available for this court' },
                ...courtSlots.map((slot) => ({
                  value: `${slot.weekday}-${slot.start_time}-${slot.end_time}`,
                  label: `${weekdayLabels[slot.weekday]} • ${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
                })),
              ]}
              required
            />
            <Input
              label="Coach"
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
            <Input label="Start time" type="time" name="startTime" value={form.startTime} readOnly required />
            <Input label="End time" type="time" name="endTime" value={form.endTime} readOnly required />
            <Input label="Notes" as="textarea" name="notes" value={form.notes} onChange={handleChange} rows="4" />
            <p className="group-note">Choose a booking date that matches the weekday of the selected slot.</p>
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
