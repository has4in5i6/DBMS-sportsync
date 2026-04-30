import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import {
  cancelBooking,
  createBooking,
  fetchBookingAvailability,
  fetchMyBookings,
} from '../../services/bookingService';
import { fetchCourts } from '../../services/courtService';
import { buildQuery, formatDate, formatTime } from '../../utils/helpers';

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayDate = () => formatLocalDate(new Date());

const getNextDateForWeekday = (weekday) => {
  if (weekday === null || weekday === undefined || Number.isNaN(Number(weekday))) {
    return '';
  }

  const current = new Date();
  current.setHours(0, 0, 0, 0);
  const distance = (Number(weekday) - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + distance);
  return formatLocalDate(current);
};

export default function Booking() {
  const [searchParams] = useSearchParams();
  const [bookingPref] = useState(() => ({
    courtId: searchParams.get('courtId') || '',
    coachId: searchParams.get('coachId') || '',
    sportType: searchParams.get('sportType') || '',
    weekday: searchParams.get('weekday') || '',
    startTime: searchParams.get('startTime') || '',
    endTime: searchParams.get('endTime') || '',
  }));
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState({ availableWeekdays: [], availableCourtSlots: [], coaches: [] });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    courtId: bookingPref.courtId,
    courtSlot: '',
    coachId: bookingPref.coachId,
    bookingDate: getNextDateForWeekday(bookingPref.weekday),
    startTime: '',
    endTime: '',
    notes: '',
  });

  const loadPage = async () => {
    try {
      setError('');
      const [courtData, bookingData] = await Promise.all([
        fetchCourts(),
        fetchMyBookings(),
      ]);
      setCourts(courtData.courts);
      setBookings(bookingData.bookings);
      if (!form.courtId && courtData.courts[0]) {
        const preferredCourt = bookingPref.sportType
          ? courtData.courts.find((court) => court.sport_type === bookingPref.sportType)
          : courtData.courts[0];
        setForm((current) => ({ ...current, courtId: String((preferredCourt || courtData.courts[0]).id) }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!form.courtId || !form.bookingDate) {
        setAvailability({ availableWeekdays: [], availableCourtSlots: [], coaches: [] });
        return;
      }

      try {
        setError('');
        const query = buildQuery({
          courtId: form.courtId,
          bookingDate: form.bookingDate,
        });
        const data = await fetchBookingAvailability(query);
        setAvailability({
          availableWeekdays: data.availableWeekdays || [],
          availableCourtSlots: data.availableCourtSlots || [],
          coaches: data.coaches || [],
        });

        if ((data.availableCourtSlots || []).length > 0) {
          const preferredSlotValue = bookingPref.weekday && bookingPref.startTime && bookingPref.endTime
            ? `${bookingPref.weekday}-${bookingPref.startTime}-${bookingPref.endTime}`
            : '';
          const selectedPreferredSlot = (data.availableCourtSlots || []).find((slot) => (
            `${slot.weekday}-${slot.startTime}-${slot.endTime}` === preferredSlotValue
          ));
          const coachSlotKeys = new Set(
            (data.coaches || []).flatMap((coach) => coach.availableSlots.map((slot) => (
              `${slot.weekday}-${slot.startTime}-${slot.endTime}`
            ))),
          );

          const firstSlotCandidate = selectedPreferredSlot
            || ((data.coaches || []).length > 0
              ? (data.availableCourtSlots || []).find((slot) => coachSlotKeys.has(`${slot.weekday}-${slot.startTime}-${slot.endTime}`))
              : null)
            || data.availableCourtSlots[0];

          const firstSlot = firstSlotCandidate || data.availableCourtSlots[0];
          const slotValue = `${firstSlot.weekday}-${firstSlot.startTime}-${firstSlot.endTime}`;
          const matchingPreferredCoach = bookingPref.coachId
            ? (data.coaches || []).find((coach) => (
              String(coach.id) === bookingPref.coachId
              && coach.availableSlots.some((slot) => `${slot.weekday}-${slot.startTime}-${slot.endTime}` === slotValue)
            ))
            : null;

          setForm((current) => ({
            ...current,
            courtSlot: slotValue,
            coachId: matchingPreferredCoach
              ? String(matchingPreferredCoach.id)
              : '',
            startTime: firstSlot.startTime,
            endTime: firstSlot.endTime,
          }));
        } else {
          setForm((current) => ({
            ...current,
            courtSlot: '',
            coachId: '',
            startTime: '',
            endTime: '',
          }));
        }
      } catch (err) {
        setError(err.message);
        setAvailability({ availableWeekdays: [], availableCourtSlots: [], coaches: [] });
      }
    };

    loadAvailability();
  }, [form.courtId, form.bookingDate]);

  const availableCoachesForSelectedSlot = availability.coaches.filter((coach) => (
    coach.availableSlots.some((slot) => (
      `${slot.weekday}-${slot.startTime}-${slot.endTime}` === form.courtSlot
    ))
  ));

  const handleChange = (event) => {
    if (event.target.name === 'courtSlot') {
      const selectedSlot = availability.availableCourtSlots.find(
        (slot) => `${slot.weekday}-${slot.startTime}-${slot.endTime}` === event.target.value,
      );

      setForm((current) => ({
        ...current,
        courtSlot: event.target.value,
        coachId: '',
        startTime: selectedSlot ? selectedSlot.startTime : '',
        endTime: selectedSlot ? selectedSlot.endTime : '',
      }));
      return;
    }

    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleCourtSelect = (courtId) => {
    setForm((current) => ({
      ...current,
      courtId: String(courtId),
      courtSlot: '',
      coachId: '',
      bookingDate: current.bookingDate || getNextDateForWeekday(bookingPref.weekday),
      startTime: '',
      endTime: '',
    }));
    setAvailability({ availableWeekdays: [], availableCourtSlots: [], coaches: [] });
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
      setForm((current) => ({
        ...current,
        courtSlot: '',
        coachId: '',
        bookingDate: '',
        startTime: '',
        endTime: '',
        notes: '',
      }));
      setAvailability({ availableWeekdays: [], availableCourtSlots: [], coaches: [] });
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
    <div className="page-shell booking-shell">
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
          <div className="scroll-box booking-form-scroll">
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
              <Input label="Booking date" type="date" min={todayDate()} name="bookingDate" value={form.bookingDate} onChange={handleChange} required />
              <Input
                label="Available court slot"
                as="select"
                name="courtSlot"
                value={form.courtSlot}
                onChange={handleChange}
                options={[
                  {
                    value: '',
                    label: form.bookingDate
                      ? (availability.availableCourtSlots.length > 0 ? 'Select a court slot' : 'No court slots available on this date')
                      : 'Choose a booking date first',
                  },
                  ...availability.availableCourtSlots.map((slot) => ({
                    value: `${slot.weekday}-${slot.startTime}-${slot.endTime}`,
                    label: `${weekdayLabels[slot.weekday]} • ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
                  })),
                ]}
                required
              />
              <Input
                label="Available coach"
                as="select"
                name="coachId"
                value={form.coachId}
                onChange={handleChange}
                options={[
                  {
                    value: '',
                    label: form.courtSlot ? 'No coach' : 'Choose a court slot first',
                  },
                  ...availableCoachesForSelectedSlot.map((coach) => ({
                    value: String(coach.id),
                    label: `${coach.full_name} - ${coach.primary_sport} • ${formatTime(form.startTime)} - ${formatTime(form.endTime)}`,
                  })),
                ]}
              />
              <Input label="Start time" type="time" name="startTime" value={form.startTime} readOnly required />
              <Input label="End time" type="time" name="endTime" value={form.endTime} readOnly required />
              <Input label="Notes" as="textarea" name="notes" value={form.notes} onChange={handleChange} rows="4" />
              <p className="group-note">
                Pick a date first and the form will show only bookable court slots and matching coaches for that day.
                {availability.availableWeekdays.length > 0 && ` This court operates on ${availability.availableWeekdays.map((day) => weekdayLabels[day]).join(', ')}.`}
                {(bookingPref.courtId || bookingPref.coachId) && ' This page was prefilled from a slot you selected in search.'}
              </p>
              {message && <p className="form-success">{message}</p>}
              {error && <p className="form-error">{error}</p>}
              <Button type="submit">Book now</Button>
            </form>
          </div>
        </Card>

        <Card title="My bookings" subtitle="Sessions you have reserved so far.">
          <div className="scroll-box booking-form-scroll">
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
          </div>
        </Card>
      </div>
    </div>
  );
}
