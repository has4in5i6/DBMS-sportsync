import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import {
  addCourtAvailability,
  createCourt,
  fetchOwnerCourts,
  updateCourt,
} from '../../services/courtService';

export default function Courts() {
  const [courts, setCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [form, setForm] = useState({
    name: '',
    sportType: 'Badminton',
    location: 'Hyderabad',
    surface: 'Synthetic',
    pricePerHour: 500,
    capacity: 4,
    description: '',
    isActive: true,
  });
  const [availabilityForm, setAvailabilityForm] = useState({ weekday: 1, startTime: '18:00', endTime: '20:00' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const response = await fetchOwnerCourts();
      setCourts(response.courts);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAvailabilityChange = (event) => {
    setAvailabilityForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const editCourt = (court) => {
    setSelectedCourtId(String(court.id));
    setForm({
      name: court.name,
      sportType: court.sport_type,
      location: court.location,
      surface: court.surface,
      pricePerHour: court.price_per_hour,
      capacity: court.capacity,
      description: court.description,
      isActive: court.is_active,
    });
  };

  const saveCourt = async (event) => {
    event.preventDefault();
    try {
      if (selectedCourtId) {
        await updateCourt(Number(selectedCourtId), {
          ...form,
          pricePerHour: Number(form.pricePerHour),
          capacity: Number(form.capacity),
        });
        setMessage('Court updated successfully.');
      } else {
        await createCourt({
          ...form,
          pricePerHour: Number(form.pricePerHour),
          capacity: Number(form.capacity),
        });
        setMessage('Court created successfully.');
      }
      setSelectedCourtId('');
      setForm({
        name: '',
        sportType: 'Badminton',
        location: 'Hyderabad',
        surface: 'Synthetic',
        pricePerHour: 500,
        capacity: 4,
        description: '',
        isActive: true,
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitAvailability = async (event) => {
    event.preventDefault();
    if (!selectedCourtId) {
      setError('Select a court first to add availability.');
      return;
    }

    try {
      await addCourtAvailability(Number(selectedCourtId), {
        weekday: Number(availabilityForm.weekday),
        startTime: availabilityForm.startTime,
        endTime: availabilityForm.endTime,
      });
      setMessage('Availability added.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-shell">
      <div className="dashboard-grid">
        <Card title="Manage courts" subtitle="Create new courts or update existing listings.">
          <form className="grid-form" onSubmit={saveCourt}>
            <Input label="Court name" name="name" value={form.name} onChange={handleChange} required />
            <Input label="Sport type" name="sportType" value={form.sportType} onChange={handleChange} required />
            <Input label="Location" name="location" value={form.location} onChange={handleChange} required />
            <Input label="Surface" name="surface" value={form.surface} onChange={handleChange} required />
            <Input label="Price per hour" type="number" name="pricePerHour" value={form.pricePerHour} onChange={handleChange} required />
            <Input label="Capacity" type="number" name="capacity" value={form.capacity} onChange={handleChange} required />
            <Input label="Description" as="textarea" name="description" value={form.description} onChange={handleChange} rows="3" />
            <label className="toggle">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              <span>Active listing</span>
            </label>
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            <Button type="submit">{selectedCourtId ? 'Update court' : 'Create court'}</Button>
          </form>
        </Card>

        <Card title="Your courts" subtitle="Click a court to edit it or attach availability slots.">
          {courts.map((court) => (
            <div className="list-item" key={court.id}>
              <strong>{court.name}</strong>
              <span>{court.sport_type} • {court.location}</span>
              <span>Rs. {court.price_per_hour}/hr • {court.is_active ? 'Active' : 'Inactive'}</span>
              <Button variant="ghost" onClick={() => editCourt(court)}>Edit</Button>
            </div>
          ))}
          {courts.length === 0 && <p>No courts added yet.</p>}
        </Card>

        <Card title="Add court availability" subtitle="Attach weekly operating hours to the selected court.">
          <form className="grid-form" onSubmit={submitAvailability}>
            <Input label="Selected court ID" name="selectedCourtDisplay" value={selectedCourtId} readOnly />
            <Input label="Weekday (0-6)" type="number" name="weekday" value={availabilityForm.weekday} onChange={handleAvailabilityChange} />
            <Input label="Start time" type="time" name="startTime" value={availabilityForm.startTime} onChange={handleAvailabilityChange} />
            <Input label="End time" type="time" name="endTime" value={availabilityForm.endTime} onChange={handleAvailabilityChange} />
            <Button type="submit">Add availability</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
