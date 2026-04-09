import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { addCoachAvailability } from '../../services/coachService';
import { addCourtAvailability, createCourt, fetchOwnerCourts } from '../../services/courtService';
import { fetchMe, updateMe } from '../../services/userService';

const weekdayOptions = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [ownerCourts, setOwnerCourts] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [coachForm, setCoachForm] = useState({
    experienceYears: 0,
    hourlyRate: 0,
    coachingHistory: '',
    weekday: 1,
    startTime: '18:00',
    endTime: '20:00',
  });
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    sportType: 'Badminton',
    location: 'Hyderabad',
    surface: 'Synthetic',
    pricePerHour: 500,
    capacity: 4,
    description: '',
    weekday: 1,
    startTime: '18:00',
    endTime: '20:00',
  });

  useEffect(() => {
    if (!user || user.role === 'player') {
      return;
    }

    fetchMe()
      .then((data) => {
        setProfile(data.user);
        if (user.role === 'coach') {
          setCoachForm((current) => ({
            ...current,
            experienceYears: data.user.experience_years || 0,
            hourlyRate: data.user.hourly_rate || 0,
            coachingHistory: data.user.coaching_history || '',
          }));
        }
      })
      .catch((err) => setError(err.message));

    if (user.role === 'owner') {
      fetchOwnerCourts()
        .then((data) => setOwnerCourts(data.courts))
        .catch((err) => setError(err.message));
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'player') {
    return <Navigate to="/" replace />;
  }

  const handleCoachChange = (event) => {
    setCoachForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleOwnerChange = (event) => {
    setOwnerForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const completeCoachOnboarding = async (event) => {
    event.preventDefault();
    try {
      setError('');
      setMessage('');
      await updateMe({
        fullName: profile.full_name,
        email: profile.email,
        primarySport: profile.primary_sport,
        skillLevel: profile.skill_level,
        city: profile.city,
        bio: profile.bio,
        availabilityNotes: profile.availability_notes,
        experienceYears: Number(coachForm.experienceYears),
        hourlyRate: Number(coachForm.hourlyRate),
        coachingHistory: coachForm.coachingHistory,
      });

      await addCoachAvailability({
        weekday: Number(coachForm.weekday),
        startTime: coachForm.startTime,
        endTime: coachForm.endTime,
      });

      setMessage('Coach onboarding saved. Your pricing and first slot are ready.');
      setTimeout(() => navigate('/coach/dashboard'), 800);
    } catch (err) {
      setError(err.message);
    }
  };

  const completeOwnerOnboarding = async (event) => {
    event.preventDefault();
    try {
      setError('');
      setMessage('');
      const courtResponse = await createCourt({
        name: ownerForm.name,
        sportType: ownerForm.sportType,
        location: ownerForm.location,
        surface: ownerForm.surface,
        pricePerHour: Number(ownerForm.pricePerHour),
        capacity: Number(ownerForm.capacity),
        description: ownerForm.description,
        isActive: true,
      });

      await addCourtAvailability(courtResponse.court.id, {
        weekday: Number(ownerForm.weekday),
        startTime: ownerForm.startTime,
        endTime: ownerForm.endTime,
      });

      setMessage('Owner onboarding saved. Your first court and slot are ready.');
      setTimeout(() => navigate('/owner/courts'), 800);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-shell auth-shell onboarding-shell">
      {user.role === 'coach' && (
        <Card title="Coach onboarding" subtitle="Set your pricing and first available coaching slot.">
          <form className="grid-form" onSubmit={completeCoachOnboarding}>
            <Input label="Experience in years" type="number" name="experienceYears" value={coachForm.experienceYears} onChange={handleCoachChange} required />
            <Input label="Hourly rate" type="number" name="hourlyRate" value={coachForm.hourlyRate} onChange={handleCoachChange} required />
            <Input label="Coaching history" as="textarea" name="coachingHistory" value={coachForm.coachingHistory} onChange={handleCoachChange} rows="4" />
            <Input label="First slot weekday" as="select" name="weekday" value={coachForm.weekday} onChange={handleCoachChange} options={weekdayOptions} required />
            <Input label="Start time" type="time" name="startTime" value={coachForm.startTime} onChange={handleCoachChange} required />
            <Input label="End time" type="time" name="endTime" value={coachForm.endTime} onChange={handleCoachChange} required />
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            <Button type="submit">Finish coach setup</Button>
          </form>
        </Card>
      )}

      {user.role === 'owner' && (
        <Card title="Owner onboarding" subtitle="Create your first court and add an opening slot.">
          {ownerCourts.length > 0 && (
            <p className="group-note">You already have {ownerCourts.length} court listing(s), but you can still use this to add another one quickly.</p>
          )}
          <form className="grid-form" onSubmit={completeOwnerOnboarding}>
            <Input label="Court name" name="name" value={ownerForm.name} onChange={handleOwnerChange} required />
            <Input label="Sport type" name="sportType" value={ownerForm.sportType} onChange={handleOwnerChange} required />
            <Input label="Location" name="location" value={ownerForm.location} onChange={handleOwnerChange} required />
            <Input label="Surface" name="surface" value={ownerForm.surface} onChange={handleOwnerChange} required />
            <Input label="Price per hour" type="number" name="pricePerHour" value={ownerForm.pricePerHour} onChange={handleOwnerChange} required />
            <Input label="Capacity" type="number" name="capacity" value={ownerForm.capacity} onChange={handleOwnerChange} required />
            <Input label="Description" as="textarea" name="description" value={ownerForm.description} onChange={handleOwnerChange} rows="3" />
            <Input label="First slot weekday" as="select" name="weekday" value={ownerForm.weekday} onChange={handleOwnerChange} options={weekdayOptions} required />
            <Input label="Start time" type="time" name="startTime" value={ownerForm.startTime} onChange={handleOwnerChange} required />
            <Input label="End time" type="time" name="endTime" value={ownerForm.endTime} onChange={handleOwnerChange} required />
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            <Button type="submit">Finish owner setup</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
