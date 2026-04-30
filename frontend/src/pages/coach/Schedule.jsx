import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { addCoachAvailability, deleteCoachAvailability, fetchCoachDashboard } from '../../services/coachService';
import { formatDate, formatTime } from '../../utils/helpers';

const weekdayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentWeekday = () => new Date().getDay();

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

export default function Schedule() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ weekday: getCurrentWeekday(), startTime: '18:00', endTime: '20:00' });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await fetchCoachDashboard();
      setData(response);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      await addCoachAvailability({
        weekday: Number(form.weekday),
        startTime: form.startTime,
        endTime: form.endTime,
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (availabilityId) => {
    try {
      setError('');
      await deleteCoachAvailability(availabilityId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!data) {
    return <div className="page-shell"><p>{error || 'Loading schedule...'}</p></div>;
  }

  return (
    <div className="page-shell">
      <div className="dashboard-grid">
        <Card title="Add availability" subtitle="Define slots players can book with you.">
          <form className="grid-form" onSubmit={handleSubmit}>
            <Input label="Weekday" as="select" name="weekday" value={form.weekday} onChange={handleChange} options={weekdayOptions} />
            <Input label="Start time" type="time" name="startTime" value={form.startTime} onChange={handleChange} />
            <Input label="End time" type="time" name="endTime" value={form.endTime} onChange={handleChange} />
            {error && <p className="form-error">{error}</p>}
            <Button type="submit">Add slot</Button>
          </form>
        </Card>

        <Card title="Availability" subtitle="Current open coaching windows.">
          <div className="scroll-box">
            {data.availability.map((slot) => (
              <div className="list-item" key={slot.id}>
                <strong>
                  {weekdayOptions.find((option) => option.value === slot.weekday)?.label}
                  {' '}
                  <span>({formatDate(getNextDateForWeekday(slot.weekday))})</span>
                </strong>
                <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                <div className="inline-actions">
                  <Button variant="secondary" onClick={() => handleDelete(slot.id)}>Delete slot</Button>
                </div>
              </div>
            ))}
            {data.availability.length === 0 && <p>No availability slots yet.</p>}
          </div>
        </Card>

        <Card title="Booked sessions" subtitle="Sessions already reserved on your calendar.">
          <div className="scroll-box">
            {data.bookings.map((booking) => (
              <div className="list-item" key={booking.id}>
                <strong>{booking.player_name}</strong>
                <span>{booking.court_name}</span>
                <span>{formatDate(booking.booking_date)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
              </div>
            ))}
            {data.bookings.length === 0 && <p>No booked sessions yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
