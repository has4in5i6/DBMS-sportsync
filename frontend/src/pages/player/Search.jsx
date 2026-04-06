import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { fetchCoaches, fetchCourts } from '../../services/searchService';
import { buildQuery } from '../../utils/helpers';

export default function Search() {
  const [filters, setFilters] = useState({ sportType: '', city: '', maxPrice: '', sport: '', skillLevel: '' });
  const [courts, setCourts] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const courtQuery = buildQuery({
        sportType: filters.sportType,
        city: filters.city,
        maxPrice: filters.maxPrice,
      });
      const coachQuery = buildQuery({
        sport: filters.sport || filters.sportType,
        city: filters.city,
        skillLevel: filters.skillLevel,
      });
      const [courtData, coachData] = await Promise.all([
        fetchCourts(courtQuery),
        fetchCoaches(coachQuery),
      ]);
      setCourts(courtData.courts);
      setCoaches(coachData.coaches);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  return (
    <div className="page-shell">
      <Card title="Search coaches and courts" subtitle="Filter by sport, location, level, and price.">
        <div className="filter-grid">
          <Input label="Sport" name="sportType" value={filters.sportType} onChange={handleChange} />
          <Input label="City" name="city" value={filters.city} onChange={handleChange} />
          <Input label="Max price per hour" name="maxPrice" type="number" value={filters.maxPrice} onChange={handleChange} />
          <Input label="Skill level" name="skillLevel" value={filters.skillLevel} onChange={handleChange} />
        </div>
        <Button onClick={loadData}>Apply filters</Button>
        {error && <p className="form-error">{error}</p>}
      </Card>

      <div className="dashboard-grid">
        <Card title="Courts" subtitle="Available venues from registered owners.">
          {courts.map((court) => (
            <div className="list-item" key={court.id}>
              <strong>{court.name}</strong>
              <span>{court.sport_type} • {court.location}</span>
              <span>Rs. {court.price_per_hour}/hr • Rating {court.average_rating}</span>
            </div>
          ))}
          {courts.length === 0 && <p>No courts match your filters.</p>}
        </Card>

        <Card title="Coaches" subtitle="Find coaches by sport, city, and skill fit.">
          {coaches.map((coach) => (
            <div className="list-item" key={coach.id}>
              <strong>{coach.full_name}</strong>
              <span>{coach.primary_sport} • {coach.city} • {coach.experience_years} years experience</span>
              <span>Rs. {coach.hourly_rate}/hr • Rating {coach.average_rating}</span>
            </div>
          ))}
          {coaches.length === 0 && <p>No coaches match your filters.</p>}
        </Card>
      </div>
    </div>
  );
}
