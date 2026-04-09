import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { createGroup, fetchGroups, fetchMyGroups, joinGroup } from '../../services/groupService';
import { fetchCoachById, fetchCoaches, fetchCourtById, fetchCourts } from '../../services/searchService';
import { buildQuery, formatTime } from '../../utils/helpers';

const skillLevelOptions = [
  { value: '', label: 'Any level' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Advanced', label: 'Advanced' },
];

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const buildBookingLink = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });
  return `/booking?${searchParams.toString()}`;
};

export default function Search() {
  const { user } = useAuth();
  const [courtFilters, setCourtFilters] = useState({ sportType: '', city: '', maxPrice: '' });
  const [coachFilters, setCoachFilters] = useState({ sport: '', city: '', skillLevel: '' });
  const [courts, setCourts] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [groupMessage, setGroupMessage] = useState('');
  const [error, setError] = useState('');
  const [expandedCourtId, setExpandedCourtId] = useState(null);
  const [expandedCoachId, setExpandedCoachId] = useState(null);
  const [courtAvailability, setCourtAvailability] = useState({});
  const [coachAvailability, setCoachAvailability] = useState({});
  const [groupForm, setGroupForm] = useState({
    name: '',
    sportType: user?.primarySport || 'Badminton',
    city: 'Hyderabad',
    skillLevel: 'Beginner',
    description: '',
    maxMembers: 8,
  });

  const loadData = async () => {
    try {
      setError('');
      setGroupMessage('');
      const courtQuery = buildQuery(courtFilters);
      const coachQuery = buildQuery(coachFilters);
      const requests = [
        fetchCourts(courtQuery),
        fetchCoaches(coachQuery),
      ];

      if (user?.role === 'player') {
        requests.push(fetchGroups(), fetchMyGroups());
      }

      const [courtData, coachData, groupData, myGroupData] = await Promise.all(requests);
      setCourts(courtData.courts);
      setCoaches(coachData.coaches);
      if (user?.role === 'player') {
        setGroups(groupData.groups);
        setMyGroups(myGroupData.groups);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCourtFilterChange = (event) => {
    setCourtFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleCoachFilterChange = (event) => {
    setCoachFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleGroupChange = (event) => {
    setGroupForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitGroup = async (event) => {
    event.preventDefault();
    try {
      setError('');
      await createGroup({ ...groupForm, maxMembers: Number(groupForm.maxMembers) });
      setGroupMessage('Group created successfully.');
      setGroupForm((current) => ({ ...current, name: '', description: '', maxMembers: 8 }));
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      setError('');
      await joinGroup(groupId);
      setGroupMessage('Joined group successfully.');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const groupSlotsByWeekday = (slots = []) => slots.reduce((accumulator, slot) => {
    const weekday = slot.weekday;
    accumulator[weekday] ||= [];
    accumulator[weekday].push(slot);
    return accumulator;
  }, {});

  const toggleCourtAvailability = async (courtId) => {
    if (expandedCourtId === courtId) {
      setExpandedCourtId(null);
      return;
    }

    setExpandedCourtId(courtId);
    if (courtAvailability[courtId]) {
      return;
    }

    try {
      setError('');
      const data = await fetchCourtById(courtId);
      setCourtAvailability((current) => ({ ...current, [courtId]: data.availability || [] }));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleCoachAvailability = async (coachId) => {
    if (expandedCoachId === coachId) {
      setExpandedCoachId(null);
      return;
    }

    setExpandedCoachId(coachId);
    if (coachAvailability[coachId]) {
      return;
    }

    try {
      setError('');
      const data = await fetchCoachById(coachId);
      setCoachAvailability((current) => ({ ...current, [coachId]: data.availability || [] }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-shell search-shell">
      <div className="dashboard-grid">
        <Card className="search-top-card search-results-card" title="Courts" subtitle="Filter venues separately by sport, city, and budget.">
          <div className="filter-grid">
            <Input label="Sport" name="sportType" value={courtFilters.sportType} onChange={handleCourtFilterChange} />
            <Input label="City" name="city" value={courtFilters.city} onChange={handleCourtFilterChange} />
            <Input label="Max price per hour" name="maxPrice" type="number" value={courtFilters.maxPrice} onChange={handleCourtFilterChange} />
          </div>
          <Button onClick={loadData}>Search now</Button>
          <div className="results-scroll">
            {courts.map((court) => (
              <div className="list-item" key={court.id}>
                <button className="availability-toggle" type="button" onClick={() => toggleCourtAvailability(court.id)}>
                  <strong>{court.name}</strong>
                  <span>{court.sport_type} • {court.location}</span>
                  <span>Rs. {court.price_per_hour}/hr • Rating {court.average_rating}</span>
                  <small className="availability-hint">{expandedCourtId === court.id ? 'Hide available weekly slots' : 'Show available weekly slots'}</small>
                </button>
                {expandedCourtId === court.id && (
                  <div className="availability-panel">
                    {Object.entries(groupSlotsByWeekday(courtAvailability[court.id] || [])).map(([weekday, slots]) => (
                      <div className="availability-day" key={weekday}>
                        <strong>{weekdayLabels[Number(weekday)]}</strong>
                        <div className="slot-row">
                          {slots.map((slot) => (
                            <Link
                              className="slot-chip"
                              key={`${slot.weekday}-${slot.start_time}-${slot.end_time}`}
                              to={buildBookingLink({
                                courtId: court.id,
                                sportType: court.sport_type,
                                weekday: slot.weekday,
                                startTime: formatTime(slot.start_time),
                                endTime: formatTime(slot.end_time),
                              })}
                            >
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(courtAvailability[court.id] || []).length === 0 && <p>No available weekly court slots added yet.</p>}
                  </div>
                )}
              </div>
            ))}
            {courts.length === 0 && <p>No courts match your filters.</p>}
          </div>
        </Card>

        <Card className="search-top-card search-results-card" title="Coaches" subtitle="Apply only the coach filters you want, even just sport.">
          <div className="filter-grid">
            <Input label="Sport" name="sport" value={coachFilters.sport} onChange={handleCoachFilterChange} />
            <Input label="City" name="city" value={coachFilters.city} onChange={handleCoachFilterChange} />
            <Input
              label="Skill level"
              as="select"
              name="skillLevel"
              value={coachFilters.skillLevel}
              onChange={handleCoachFilterChange}
              options={skillLevelOptions}
            />
          </div>
          <Button onClick={loadData}>Find coaches</Button>
          <div className="results-scroll">
            {coaches.map((coach) => (
              <div className="list-item" key={coach.id}>
                <button className="availability-toggle" type="button" onClick={() => toggleCoachAvailability(coach.id)}>
                  <strong>{coach.full_name}</strong>
                  <span>{coach.primary_sport} • {coach.city} • {coach.experience_years} years experience</span>
                  <span>Rs. {coach.hourly_rate}/hr • Rating {coach.average_rating}</span>
                  <small className="availability-hint">{expandedCoachId === coach.id ? 'Hide available weekly slots' : 'Show available weekly slots'}</small>
                </button>
                {expandedCoachId === coach.id && (
                  <div className="availability-panel">
                    {Object.entries(groupSlotsByWeekday(coachAvailability[coach.id] || [])).map(([weekday, slots]) => (
                      <div className="availability-day" key={weekday}>
                        <strong>{weekdayLabels[Number(weekday)]}</strong>
                        <div className="slot-row">
                          {slots.map((slot) => (
                            <Link
                              className="slot-chip"
                              key={`${slot.weekday}-${slot.start_time}-${slot.end_time}`}
                              to={buildBookingLink({
                                coachId: coach.id,
                                sportType: coach.primary_sport,
                                weekday: slot.weekday,
                                startTime: formatTime(slot.start_time),
                                endTime: formatTime(slot.end_time),
                              })}
                            >
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(coachAvailability[coach.id] || []).length === 0 && <p>No available weekly coach slots added yet.</p>}
                  </div>
                )}
              </div>
            ))}
            {coaches.length === 0 && <p>No coaches match your filters.</p>}
          </div>
        </Card>

        {user?.role === 'player' && (
          <Card className="search-top-card" title="Create group" subtitle="Start a new playing circle here.">
            <form className="grid-form" onSubmit={submitGroup}>
              <Input label="Group name" name="name" value={groupForm.name} onChange={handleGroupChange} required />
              <Input label="Sport" name="sportType" value={groupForm.sportType} onChange={handleGroupChange} required />
              <Input label="City" name="city" value={groupForm.city} onChange={handleGroupChange} required />
              <Input
                label="Skill level"
                as="select"
                name="skillLevel"
                value={groupForm.skillLevel}
                onChange={handleGroupChange}
                options={skillLevelOptions.slice(1)}
                required
              />
              <Input label="Max members" type="number" name="maxMembers" value={groupForm.maxMembers} onChange={handleGroupChange} required />
              <Input label="Description" as="textarea" name="description" value={groupForm.description} onChange={handleGroupChange} rows="3" />
              {groupMessage && <p className="form-success">{groupMessage}</p>}
              <Button type="submit">Create group</Button>
            </form>
          </Card>
        )}

        {user?.role === 'player' && (
          <Card title="Available groups" subtitle="Join an existing playing circle.">
            <div className="stack">
              {groups.map((group) => (
                <div className="list-item" key={group.id}>
                  <strong>{group.name}</strong>
                  <span>{group.sport_type} • {group.city} • {group.member_count}/{group.max_members}</span>
                  <div className="inline-actions">
                    <Link className="text-link" to={`/groups/${group.id}`}>Open group</Link>
                    <Button variant="ghost" onClick={() => handleJoinGroup(group.id)}>Join</Button>
                  </div>
                </div>
              ))}
              {groups.length === 0 && <p>No groups available right now.</p>}
            </div>
          </Card>
        )}

        {user?.role === 'player' && (
          <Card title="My groups" subtitle="Groups you have already joined.">
            {myGroups.map((group) => (
              <div className="list-item" key={group.id}>
                <strong>{group.name}</strong>
                <span>{group.sport_type} • {group.city} • {group.member_count} members</span>
                <Link className="text-link" to={`/groups/${group.id}`}>Open group</Link>
              </div>
            ))}
            {myGroups.length === 0 && <p>No group memberships yet.</p>}
          </Card>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
