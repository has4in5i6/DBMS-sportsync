import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { createReview, fetchMyReviewTargets } from '../../services/reviewService';
import { fetchMe, updateMe } from '../../services/userService';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [courts, setCourts] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reviewTargetsLoaded, setReviewTargetsLoaded] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewType: 'coach',
    targetId: '',
    rating: 5,
    comment: '',
  });

  const loadPage = async () => {
    try {
      setError('');
      const profileData = await fetchMe();
      setProfile(profileData.user);

      if (user?.role === 'player') {
        try {
          const reviewTargetData = await fetchMyReviewTargets();
          setCourts(reviewTargetData.courts || []);
          setCoaches(reviewTargetData.coaches || []);
        } catch (reviewErr) {
          setCourts([]);
          setCoaches([]);
          console.warn('Unable to load review targets:', reviewErr.message);
        } finally {
          setReviewTargetsLoaded(true);
        }
      } else {
        setCourts([]);
        setCoaches([]);
        setReviewTargetsLoaded(true);
      }
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

  const handleReviewChange = (event) => {
    setReviewForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
      ...(event.target.name === 'reviewType' ? { targetId: '' } : {}),
    }));
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      await createReview({
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
        coachId: reviewForm.reviewType === 'coach' ? Number(reviewForm.targetId) : null,
        courtId: reviewForm.reviewType === 'court' ? Number(reviewForm.targetId) : null,
      });
      setMessage('Review submitted successfully.');
      setError('');
      setReviewForm((current) => ({ ...current, targetId: '', comment: '' }));
    } catch (err) {
      setError(err.message);
    }
  };

  const availableTargets = reviewForm.reviewType === 'coach' ? coaches : courts;
  const noTargetsMessage = !reviewTargetsLoaded
    ? 'Loading your review options...'
    : (reviewForm.reviewType === 'coach'
      ? 'No coaches from your booked sessions are available to review yet.'
      : 'No courts from your booked sessions are available to review yet.');

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

        <Card title="Leave a review" subtitle="Rate a coach or court after your session.">
          <form className="grid-form" onSubmit={submitReview}>
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
            <Input
              label="Target"
              as="select"
              name="targetId"
              value={reviewForm.targetId}
              onChange={handleReviewChange}
              options={[
                { value: '', label: 'Select a target' },
                ...availableTargets.map((target) => ({
                  value: String(target.id),
                  label: target.full_name || target.name,
                })),
              ]}
              required
            />
            <Input label="Rating" type="number" min="1" max="5" name="rating" value={reviewForm.rating} onChange={handleReviewChange} />
            <Input label="Comment" as="textarea" name="comment" value={reviewForm.comment} onChange={handleReviewChange} rows="3" />
            {availableTargets.length === 0 && <p className="group-note">{noTargetsMessage}</p>}
            <Button type="submit">Submit review</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
