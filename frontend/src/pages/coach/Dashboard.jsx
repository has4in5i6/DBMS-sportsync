import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { fetchCoachDashboard } from '../../services/coachService';
import { formatDate, formatTime } from '../../utils/helpers';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCoachDashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (!data) {
    return <div className="page-shell"><p>{error || 'Loading dashboard...'}</p></div>;
  }

  return (
    <div className="page-shell">
      <div className="dashboard-grid">
        <Card title={data.coach.full_name} subtitle={`${data.coach.primary_sport} coach`}>
          <div className="stats-row">
            <div className="stat-box">
              <span>Experience</span>
              <strong>{data.coach.experience_years} years</strong>
            </div>
            <div className="stat-box">
              <span>Rate</span>
              <strong>Rs. {data.coach.hourly_rate}/hr</strong>
            </div>
            <div className="stat-box">
              <span>Reviews</span>
              <strong>{data.coach.average_rating}</strong>
            </div>
          </div>
          <p>{data.coach.bio}</p>
          <Link className="cta-link primary inline-cta" to="/coach/schedule">Manage schedule</Link>
        </Card>

        <Card title="Upcoming sessions" subtitle="Bookings assigned to you and court reservations you made.">
          {data.bookings.length === 0 && <p>No coaching sessions or court reservations yet.</p>}
          {data.bookings.map((booking) => (
            <div className="list-item" key={booking.id}>
              <strong>{booking.player_name || 'Self-booked court'}</strong>
              <span>{booking.court_name}</span>
              <span>{formatDate(booking.booking_date)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
            </div>
          ))}
        </Card>

        <Card title="Recent reviews" subtitle="Feedback from players.">
          {data.reviews.length === 0 && <p>No reviews yet.</p>}
          {data.reviews.map((review) => (
            <div className="list-item" key={review.id}>
              <strong>{review.reviewer_name}</strong>
              <span>Rating: {review.rating}/5</span>
              <span>{review.comment}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
