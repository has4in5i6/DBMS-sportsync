-- Top rated coaches
SELECT
  u.full_name,
  u.primary_sport,
  cp.hourly_rate,
  ROUND(AVG(r.rating), 2) AS avg_rating
FROM users u
JOIN coach_profiles cp ON cp.user_id = u.id
LEFT JOIN reviews r ON r.coach_id = u.id
GROUP BY u.id, cp.user_id
ORDER BY avg_rating DESC NULLS LAST;

-- Active court catalogue with owner names
SELECT
  c.name,
  c.sport_type,
  c.location,
  c.price_per_hour,
  u.full_name AS owner_name
FROM courts c
JOIN users u ON u.id = c.owner_id
WHERE c.is_active = TRUE
ORDER BY c.sport_type, c.price_per_hour;

-- Booking overview
SELECT
  b.booking_date,
  b.start_time,
  b.end_time,
  player.full_name AS player_name,
  coach.full_name AS coach_name,
  c.name AS court_name,
  b.total_price
FROM bookings b
JOIN users player ON player.id = b.player_id
LEFT JOIN users coach ON coach.id = b.coach_id
JOIN courts c ON c.id = b.court_id
WHERE b.status = 'confirmed'
ORDER BY b.booking_date, b.start_time;

-- Group participation
SELECT
  g.name,
  g.sport_type,
  COUNT(gm.user_id) AS members
FROM player_groups g
LEFT JOIN group_members gm ON gm.group_id = g.id
GROUP BY g.id
ORDER BY members DESC, g.name ASC;
