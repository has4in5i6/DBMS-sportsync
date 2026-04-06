import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { createGroup, fetchGroups, fetchMyGroups, joinGroup } from '../../services/groupService';
import { createReview } from '../../services/reviewService';
import { fetchCoaches, fetchCourts } from '../../services/searchService';
import { fetchMe, updateMe } from '../../services/userService';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [courts, setCourts] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [groupForm, setGroupForm] = useState({
    name: '',
    sportType: user?.primarySport || 'Badminton',
    city: 'Hyderabad',
    skillLevel: 'Beginner',
    description: '',
    maxMembers: 8,
  });
  const [reviewForm, setReviewForm] = useState({
    reviewType: 'coach',
    targetId: '',
    rating: 5,
    comment: '',
  });

  const loadPage = async () => {
    try {
      const [profileData, allGroups, joinedGroups, courtData, coachData] = await Promise.all([
        fetchMe(),
        fetchGroups(),
        user.role === 'player' ? fetchMyGroups() : Promise.resolve({ groups: [] }),
        fetchCourts(),
        fetchCoaches(),
      ]);

      setProfile(profileData.user);
      setGroups(allGroups.groups);
      setMyGroups(joinedGroups.groups);
      setCourts(courtData.courts);
      setCoaches(coachData.coaches);
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
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGroupChange = (event) => {
    setGroupForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleReviewChange = (event) => {
    setReviewForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitGroup = async (event) => {
    event.preventDefault();
    try {
      await createGroup({ ...groupForm, maxMembers: Number(groupForm.maxMembers) });
      setMessage('Group created successfully.');
      loadPage();
    } catch (err) {
      setError(err.message);
    }
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
      setReviewForm((current) => ({ ...current, targetId: '', comment: '' }));
    } catch (err) {
      setError(err.message);
    }
  };

  const availableTargets = reviewForm.reviewType === 'coach' ? coaches : courts;

  if (!profile) {
    return <div className="page-shell"><p>Loading profile...</p></div>;
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

        {user.role === 'player' && (
          <>
            <Card title="Create or join groups" subtitle="Build recurring play circles with other players.">
              <form className="grid-form" onSubmit={submitGroup}>
                <Input label="Group name" name="name" value={groupForm.name} onChange={handleGroupChange} required />
                <Input label="Sport" name="sportType" value={groupForm.sportType} onChange={handleGroupChange} required />
                <Input label="City" name="city" value={groupForm.city} onChange={handleGroupChange} required />
                <Input label="Skill level" name="skillLevel" value={groupForm.skillLevel} onChange={handleGroupChange} required />
                <Input label="Max members" type="number" name="maxMembers" value={groupForm.maxMembers} onChange={handleGroupChange} required />
                <Input label="Description" as="textarea" name="description" value={groupForm.description} onChange={handleGroupChange} rows="3" />
                <Button type="submit">Create group</Button>
              </form>
              <div className="stack">
                {groups.map((group) => (
                  <div className="list-item" key={group.id}>
                    <strong>{group.name}</strong>
                    <span>{group.sport_type} • {group.city} • {group.member_count}/{group.max_members}</span>
                    <div className="inline-actions">
                      <Link className="text-link" to={`/groups/${group.id}`}>Open group</Link>
                      <Button variant="ghost" onClick={() => joinGroup(group.id).then(loadPage).catch((err) => setError(err.message))}>
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="My groups" subtitle="Communities you are already part of.">
              {myGroups.length === 0 && <p>No group memberships yet.</p>}
              {myGroups.map((group) => (
                <div className="list-item" key={group.id}>
                  <strong>{group.name}</strong>
                  <span>{group.sport_type} • {group.city} • {group.member_count} members</span>
                  <Link className="text-link" to={`/groups/${group.id}`}>Open group</Link>
                </div>
              ))}
            </Card>
          </>
        )}

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
            <Button type="submit">Submit review</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
