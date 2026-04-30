import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import {
  cancelBooking,
  createBooking,
  fetchBookingAvailability,
  fetchMyBookings,
} from '../../services/bookingService';
import { fetchCourts } from '../../services/courtService';
import { createReview, fetchMyReviewTargets } from '../../services/reviewService';
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
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isCoachView = user?.role === 'coach';
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
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewTargetsLoaded, setReviewTargetsLoaded] = useState(false);
  const [reviewTargets, setReviewTargets] = useState({ courts: [], coaches: [] });
  const [reviewForm, setReviewForm] = useState({
    reviewType: 'court',
    targetId: '',
    rating: 5,
    comment: '',
  });
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
      const [courtData, bookingData, reviewTargetData] = await Promise.all([
        fetchCourts(),
        fetchMyBookings(),
        fetchMyReviewTargets(),
      ]);
      setCourts(courtData.courts);
      setBookings(bookingData.bookings);
      setReviewTargets({
        courts: reviewTargetData.courts || [],
        coaches: reviewTargetData.coaches || [],
      });
      setReviewTargetsLoaded(true);
      if (!form.courtId && courtData.courts[0]) {
        const preferredCourt = bookingPref.sportType
          ? courtData.courts.find((court) => court.sport_type === bookingPref.sportType)
          : courtData.courts[0];
        setForm((current) => ({ ...current, courtId: String((preferredCourt || courtData.courts[0]).id) }));
      }
    } catch (err) {
      setError(err.message);
      setReviewTargets({ courts: [], coaches: [] });
      setReviewTargetsLoaded(true);
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
            || (!isCoachView && (data.coaches || []).length > 0
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
            coachId: !isCoachView && matchingPreferredCoach
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
  }, [form.courtId, form.bookingDate, isCoachView]);

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
        coachId: isCoachView ? null : (form.coachId ? Number(form.coachId) : null),
      });
      setMessage(isCoachView ? 'Court booked successfully.' : 'Booking created successfully.');
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

  const handleReviewChange = (event) => {
    setReviewForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
      ...(event.target.name === 'reviewType' ? { targetId: '' } : {}),
    }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    try {
      await createReview({
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
        coachId: !isCoachView && reviewForm.reviewType === 'coach' ? Number(reviewForm.targetId) : null,
        courtId: reviewForm.reviewType === 'court' ? Number(reviewForm.targetId) : null,
      });
      setReviewMessage('Review submitted successfully.');
      setReviewError('');
      setReviewForm((current) => ({ ...current, targetId: '', comment: '' }));
    } catch (err) {
      setReviewError(err.message);
      setReviewMessage('');
    }
  };

  const availableReviewTargets = reviewForm.reviewType === 'coach'
    ? reviewTargets.coaches
    : reviewTargets.courts;
  const noTargetsMessage = !reviewTargetsLoaded
    ? 'Loading your review options...'
    : (isCoachView
      ? 'No courts from your completed bookings are available to review yet.'
      : (reviewForm.reviewType === 'coach'
      ? 'No coaches from your booked sessions are available to review yet.'
      : 'No courts from your booked sessions are available to review yet.'));

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

        <Card
          title={isCoachView ? 'Book a court' : 'Create booking'}
          subtitle={isCoachView
            ? 'Choose your court and a slot that also fits your own availability.'
            : 'Choose your selected court, optional coach, and session time.'}
        >
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
              {!isCoachView && (
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
              )}
              <Input label="Start time" type="time" name="startTime" value={form.startTime} readOnly required />
              <Input label="End time" type="time" name="endTime" value={form.endTime} readOnly required />
              <Input label="Notes" as="textarea" name="notes" value={form.notes} onChange={handleChange} rows="4" />
              <p className="group-note">
                {isCoachView
                  ? 'Pick a date first and the form will show only court slots that fit both the court schedule and your own availability.'
                  : 'Pick a date first and the form will show only bookable court slots and matching coaches for that day.'}
                {availability.availableWeekdays.length > 0 && ` This court operates on ${availability.availableWeekdays.map((day) => weekdayLabels[day]).join(', ')}.`}
                {!isCoachView && (bookingPref.courtId || bookingPref.coachId) && ' This page was prefilled from a slot you selected in search.'}
              </p>
              {message && <p className="form-success">{message}</p>}
              {error && <p className="form-error">{error}</p>}
              <Button type="submit">{isCoachView ? 'Reserve court' : 'Book now'}</Button>
            </form>
          </div>
        </Card>

        <Card
          title="My bookings"
          subtitle={isCoachView
            ? 'Your active coaching sessions and self-booked court reservations.'
            : 'Your active bookings and upcoming sessions.'}
        >
          <div className="scroll-box booking-form-scroll">
            {bookings.map((booking) => (
              <div className="list-item" key={booking.id}>
                <strong>{booking.court_name}</strong>
                <span>{formatDate(booking.booking_date)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                <span>
                  {isCoachView
                    ? (booking.player_name ? `Player: ${booking.player_name}` : 'Self-booked court')
                    : (booking.coach_name ? `Coach: ${booking.coach_name}` : 'Court-only booking')}
                  {' • '}
                  Status: {booking.status}
                </span>
                {booking.status === 'confirmed' && (!isCoachView || !booking.player_name) && (
                  <Button variant="ghost" onClick={() => handleCancel(booking.id)}>Cancel</Button>
                )}
              </div>
            ))}
            {bookings.length === 0 && <p>No bookings yet.</p>}
          </div>
        </Card>

        <Card
          title="Reviews"
          subtitle={isCoachView
            ? 'Review courts only after your session has finished.'
            : 'Review courts or coaches only after the booked session has finished.'}
        >
          <div className="scroll-box booking-form-scroll">
            <form className="grid-form" onSubmit={handleReviewSubmit}>
              {!isCoachView && (
                <Input
                  label="Review type"
                  as="select"
                  name="reviewType"
                  value={reviewForm.reviewType}
                  onChange={handleReviewChange}
                  options={[
                    { value: 'coach', label: 'Coach' },
                    { value: 'court', label: 'Court' },
                  ]}
                />
              )}
              <Input
                label="Target"
                as="select"
                name="targetId"
                value={reviewForm.targetId}
                onChange={handleReviewChange}
                options={[
                  { value: '', label: 'Select a target' },
                  ...availableReviewTargets.map((target) => ({
                    value: String(target.id),
                    label: target.full_name || target.name,
                  })),
                ]}
                required
              />
              <Input label="Rating" type="number" min="1" max="5" name="rating" value={reviewForm.rating} onChange={handleReviewChange} />
              <Input label="Comment" as="textarea" name="comment" value={reviewForm.comment} onChange={handleReviewChange} rows="3" />
              {availableReviewTargets.length === 0 && <p className="group-note">{noTargetsMessage}</p>}
              <p className="group-note">
                Reviews unlock only after the session end time has passed. Cancelled bookings do not appear here.
              </p>
              {reviewMessage && <p className="form-success">{reviewMessage}</p>}
              {reviewError && <p className="form-error">{reviewError}</p>}
              <Button type="submit">{isCoachView ? 'Submit court review' : 'Submit review'}</Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
