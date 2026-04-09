import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { fetchOverview } from '../../services/userService';
import { formatDate, formatTime } from '../../utils/helpers';

export default function Home() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchOverview()
      .then(setOverview)
      .catch((err) => setError(err.message));
  }, [user]);

  return (
    <div className="page-shell home-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Train harder. Book faster. Play together.</p>
          <h1>Build your next match day with courts, coaches, and your sports crew in one place.</h1>
          <p className="hero-copy">
            SportSync is built for active players and busy venues: scout the right court, line up a coach,
            reserve conflict-free sessions, and keep your local sports circle moving every week.
          </p>
          <div className="hero-actions">
            <Link className="cta-link primary" to="/search">Explore coaches and courts</Link>
            {!user && <Link className="cta-link secondary" to="/signup">Create an account</Link>}
          </div>
        </div>
        <div className="hero-panel">
          <div className="metric">
            <span>Matchday setup</span>
            <strong>Courts, coaches, and crews</strong>
          </div>
          <div className="metric">
            <span>Fast booking</span>
            <strong>Live court selection</strong>
          </div>
          <div className="metric">
            <span>Stay in rhythm</span>
            <strong>Groups, reviews, and schedules</strong>
          </div>
        </div>
      </section>

      {user && overview && (
        <section className="dashboard-grid">
          <Card title={`Welcome, ${user.fullName}`} subtitle={`Signed in as ${user.role}.`}>
            <div className="stats-row">
              <div className="stat-box">
                <span>Bookings</span>
                <strong>{overview.stats.bookingsCount}</strong>
              </div>
              <div className="stat-box">
                <span>Groups</span>
                <strong>{overview.stats.groupsCount}</strong>
              </div>
            </div>
          </Card>

          <Card title="Upcoming activity" subtitle="A quick snapshot of your next sessions.">
            {overview.bookings.length === 0 && <p>No bookings yet.</p>}
            {overview.bookings.map((booking) => (
              <div className="list-item" key={booking.id}>
                <strong>{booking.court_name}</strong>
                <span>{formatDate(booking.booking_date)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
              </div>
            ))}
          </Card>

          {user.role === 'player' && (
            <Card title="Your groups" subtitle="Stay connected with regular play circles.">
              {overview.groups.length === 0 && <p>You are not in any groups yet.</p>}
              {overview.groups.map((group) => (
                <div className="list-item" key={group.id}>
                  <strong>{group.name}</strong>
                  <span>{group.sport_type} • {group.city} • {group.member_count} members</span>
                  <Link className="text-link" to={`/groups/${group.id}`}>Open group</Link>
                </div>
              ))}
            </Card>
          )}
        </section>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
