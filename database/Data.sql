INSERT INTO users (
  username, email, password_hash, full_name, role, primary_sport, skill_level, city, bio, availability_notes
) VALUES
(
  'ananya_player',
  'ananya@sportsync.com',
  crypt('player123', gen_salt('bf')),
  'Ananya Rao',
  'player',
  'Badminton',
  'Intermediate',
  'Hyderabad',
  'Weekend badminton player looking for coached sessions and doubles groups.',
  'Available weekdays after 6 PM and weekends.'
),
(
  'rahul_player',
  'rahul@sportsync.com',
  crypt('player123', gen_salt('bf')),
  'Rahul Menon',
  'player',
  'Tennis',
  'Beginner',
  'Hyderabad',
  'Learning tennis and looking for friendly practice groups.',
  'Usually free on Saturday mornings.'
),
(
  'coach_meera',
  'meera@sportsync.com',
  crypt('coach123', gen_salt('bf')),
  'Meera Nair',
  'coach',
  'Badminton',
  'Advanced',
  'Hyderabad',
  'Certified badminton coach focused on footwork, conditioning, and match prep.',
  'Takes evening and weekend slots.'
),
(
  'coach_arjun',
  'arjun@sportsync.com',
  crypt('coach123', gen_salt('bf')),
  'Arjun Varma',
  'coach',
  'Tennis',
  'Advanced',
  'Hyderabad',
  'Former district player offering technical and tactical tennis coaching.',
  'Open for morning coaching blocks.'
),
(
  'owner_sneha',
  'sneha@sportsync.com',
  crypt('owner123', gen_salt('bf')),
  'Sneha Reddy',
  'owner',
  'Badminton',
  'Advanced',
  'Hyderabad',
  'Runs a multi-sport indoor facility in Gachibowli.',
  'Facility helpdesk available 8 AM to 9 PM.'
),
(
  'owner_karthik',
  'karthik@sportsync.com',
  crypt('owner123', gen_salt('bf')),
  'Karthik Iyer',
  'owner',
  'Tennis',
  'Advanced',
  'Hyderabad',
  'Owns an outdoor tennis center used by college players and coaches.',
  'Open to recurring bookings.'
);

INSERT INTO coach_profiles (user_id, experience_years, hourly_rate, coaching_history) VALUES
((SELECT id FROM users WHERE username = 'coach_meera'), 7, 900.00, 'Worked with school and academy level badminton players for 7 years.'),
((SELECT id FROM users WHERE username = 'coach_arjun'), 9, 1200.00, 'Former district circuit competitor with structured beginner-to-advanced programs.');

INSERT INTO coach_availability (coach_id, weekday, start_time, end_time) VALUES
((SELECT id FROM users WHERE username = 'coach_meera'), 1, '18:00', '21:00'),
((SELECT id FROM users WHERE username = 'coach_meera'), 3, '18:00', '21:00'),
((SELECT id FROM users WHERE username = 'coach_meera'), 6, '08:00', '12:00'),
((SELECT id FROM users WHERE username = 'coach_arjun'), 2, '06:00', '10:00'),
((SELECT id FROM users WHERE username = 'coach_arjun'), 4, '06:00', '10:00'),
((SELECT id FROM users WHERE username = 'coach_arjun'), 6, '07:00', '11:00');

INSERT INTO courts (owner_id, name, sport_type, location, surface, price_per_hour, capacity, description) VALUES
(
  (SELECT id FROM users WHERE username = 'owner_sneha'),
  'Gachibowli Smash Arena Court 1',
  'Badminton',
  'Gachibowli, Hyderabad',
  'Synthetic',
  500.00,
  4,
  'Indoor air-conditioned badminton court with lighting and equipment rental.'
),
(
  (SELECT id FROM users WHERE username = 'owner_sneha'),
  'Gachibowli Smash Arena Court 2',
  'Badminton',
  'Gachibowli, Hyderabad',
  'Synthetic',
  450.00,
  4,
  'Practice-focused court ideal for group sessions and drills.'
),
(
  (SELECT id FROM users WHERE username = 'owner_karthik'),
  'Sunrise Tennis Centre Court A',
  'Tennis',
  'Madhapur, Hyderabad',
  'Hard',
  700.00,
  4,
  'Outdoor hard-court tennis space with floodlights for early and late sessions.'
);

INSERT INTO court_availability (court_id, weekday, start_time, end_time) VALUES
((SELECT id FROM courts WHERE name = 'Gachibowli Smash Arena Court 1'), 1, '17:00', '22:00'),
((SELECT id FROM courts WHERE name = 'Gachibowli Smash Arena Court 1'), 3, '17:00', '22:00'),
((SELECT id FROM courts WHERE name = 'Gachibowli Smash Arena Court 1'), 6, '07:00', '13:00'),
((SELECT id FROM courts WHERE name = 'Gachibowli Smash Arena Court 2'), 2, '17:00', '22:00'),
((SELECT id FROM courts WHERE name = 'Gachibowli Smash Arena Court 2'), 4, '17:00', '22:00'),
((SELECT id FROM courts WHERE name = 'Sunrise Tennis Centre Court A'), 2, '06:00', '11:00'),
((SELECT id FROM courts WHERE name = 'Sunrise Tennis Centre Court A'), 4, '06:00', '11:00'),
((SELECT id FROM courts WHERE name = 'Sunrise Tennis Centre Court A'), 6, '06:00', '12:00');

INSERT INTO bookings (
  player_id, court_id, coach_id, booking_date, start_time, end_time, total_price, notes
) VALUES
(
  (SELECT id FROM users WHERE username = 'ananya_player'),
  (SELECT id FROM courts WHERE name = 'Gachibowli Smash Arena Court 1'),
  (SELECT id FROM users WHERE username = 'coach_meera'),
  DATE '2026-04-08',
  '18:00',
  '19:00',
  1400.00,
  'Focused coaching session for doubles rotation and net play.'
),
(
  (SELECT id FROM users WHERE username = 'rahul_player'),
  (SELECT id FROM courts WHERE name = 'Sunrise Tennis Centre Court A'),
  (SELECT id FROM users WHERE username = 'coach_arjun'),
  DATE '2026-04-09',
  '07:00',
  '08:00',
  1900.00,
  'Beginner tennis fundamentals session.'
);

INSERT INTO player_groups (
  name, sport_type, city, skill_level, description, max_members, created_by
) VALUES
(
  'Hyderabad Weekend Smashers',
  'Badminton',
  'Hyderabad',
  'Intermediate',
  'Regular weekend badminton group for rally play and friendly doubles.',
  8,
  (SELECT id FROM users WHERE username = 'ananya_player')
),
(
  'Madhapur Morning Tennis Crew',
  'Tennis',
  'Hyderabad',
  'Beginner',
  'Casual beginner-friendly tennis meetups near Madhapur.',
  6,
  (SELECT id FROM users WHERE username = 'rahul_player')
);

INSERT INTO group_members (group_id, user_id, member_role) VALUES
((SELECT id FROM player_groups WHERE name = 'Hyderabad Weekend Smashers'), (SELECT id FROM users WHERE username = 'ananya_player'), 'captain'),
((SELECT id FROM player_groups WHERE name = 'Madhapur Morning Tennis Crew'), (SELECT id FROM users WHERE username = 'rahul_player'), 'captain');

INSERT INTO group_messages (group_id, sender_id, message_text) VALUES
(
  (SELECT id FROM player_groups WHERE name = 'Hyderabad Weekend Smashers'),
  (SELECT id FROM users WHERE username = 'ananya_player'),
  'Hi everyone, planning a doubles session this Saturday at 8 AM. Who is in?'
),
(
  (SELECT id FROM player_groups WHERE name = 'Madhapur Morning Tennis Crew'),
  (SELECT id FROM users WHERE username = 'rahul_player'),
  'Welcome to the group. Let us use this chat to coordinate practice sessions.'
);

INSERT INTO reviews (reviewer_id, coach_id, court_id, rating, comment) VALUES
(
  (SELECT id FROM users WHERE username = 'ananya_player'),
  (SELECT id FROM users WHERE username = 'coach_meera'),
  NULL,
  5,
  'Very structured coaching with clear drills and actionable feedback.'
),
(
  (SELECT id FROM users WHERE username = 'rahul_player'),
  (SELECT id FROM users WHERE username = 'coach_arjun'),
  NULL,
  4,
  'Good beginner sessions and patient explanation of fundamentals.'
),
(
  (SELECT id FROM users WHERE username = 'ananya_player'),
  NULL,
  (SELECT id FROM courts WHERE name = 'Gachibowli Smash Arena Court 1'),
  5,
  'Clean court, good lighting, and easy booking experience.'
);
