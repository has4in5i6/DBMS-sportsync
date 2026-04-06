import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { addCoachAvailability, fetchCoachDashboard } from '../../services/coachService';
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

export default function Schedule() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ weekday: 1, startTime: '18:00', endTime: '20:00' });
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
          {data.availability.map((slot) => (
            <div className="list-item" key={slot.id}>
              <strong>{weekdayOptions.find((option) => option.value === slot.weekday)?.label}</strong>
              <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
            </div>
          ))}
          {data.availability.length === 0 && <p>No availability slots yet.</p>}
        </Card>

        <Card title="Booked sessions" subtitle="Sessions already reserved on your calendar.">
          {data.bookings.map((booking) => (
            <div className="list-item" key={booking.id}>
              <strong>{booking.player_name}</strong>
              <span>{booking.court_name}</span>
              <span>{formatDate(booking.booking_date)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
            </div>
          ))}
          {data.bookings.length === 0 && <p>No booked sessions yet.</p>}
        </Card>
      </div>
    </div>
  );
}
