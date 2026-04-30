import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { fetchMe, updateMe } from '../../services/userService';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPage = async () => {
    try {
      setError('');
      const profileData = await fetchMe();
      setProfile(profileData.user);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const handleProfileChange = (event) => {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const response = await updateMe({
        fullName: profile.full_name,
        email: profile.email,
        primarySport: profile.primary_sport,
        skillLevel: profile.skill_level,
        city: profile.city,
        bio: profile.bio,
        availabilityNotes: profile.availability_notes,
        experienceYears: profile.experience_years,
        hourlyRate: profile.hourly_rate,
        coachingHistory: profile.coaching_history,
      });
      setProfile(response.user);
      setUser((current) => ({ ...current, fullName: response.user.full_name }));
      setMessage('Profile updated successfully.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!profile) {
    return (
      <div className="page-shell">
        <p className={error ? 'form-error' : ''}>{error || 'Loading profile...'}</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="dashboard-grid">
        <Card title="My profile" subtitle="Keep your sport preferences and availability current.">
          <form className="grid-form" onSubmit={saveProfile}>
            <Input label="Full name" name="full_name" value={profile.full_name || ''} onChange={handleProfileChange} />
            <Input label="Email" name="email" value={profile.email || ''} onChange={handleProfileChange} />
            <Input label="Primary sport" name="primary_sport" value={profile.primary_sport || ''} onChange={handleProfileChange} />
            <Input label="Skill level" name="skill_level" value={profile.skill_level || ''} onChange={handleProfileChange} />
            <Input label="City" name="city" value={profile.city || ''} onChange={handleProfileChange} />
            <Input label="Bio" as="textarea" name="bio" value={profile.bio || ''} onChange={handleProfileChange} rows="3" />
            <Input label="Availability notes" as="textarea" name="availability_notes" value={profile.availability_notes || ''} onChange={handleProfileChange} rows="3" />
            {user.role === 'coach' && (
              <>
                <Input label="Experience (years)" type="number" name="experience_years" value={profile.experience_years || 0} onChange={handleProfileChange} />
                <Input label="Hourly rate" type="number" name="hourly_rate" value={profile.hourly_rate || 0} onChange={handleProfileChange} />
                <Input label="Coaching history" as="textarea" name="coaching_history" value={profile.coaching_history || ''} onChange={handleProfileChange} rows="3" />
              </>
            )}
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            <Button type="submit">Save profile</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
