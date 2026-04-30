CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS group_join_requests CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS player_groups CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS court_availability CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS coach_availability CASCADE;
DROP TABLE IF EXISTS coach_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('player', 'coach', 'owner')),
  primary_sport VARCHAR(50) NOT NULL,
  skill_level VARCHAR(30) NOT NULL,
  city VARCHAR(100) NOT NULL,
  bio TEXT DEFAULT '',
  availability_notes TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coach_profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  experience_years INT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  coaching_history TEXT DEFAULT ''
);

CREATE TABLE coach_availability (
  id SERIAL PRIMARY KEY,
  coach_id INT NOT NULL REFERENCES coach_profiles(user_id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CHECK (start_time < end_time)
);

CREATE TABLE courts (
  id SERIAL PRIMARY KEY,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  sport_type VARCHAR(50) NOT NULL,
  location VARCHAR(200) NOT NULL,
  surface VARCHAR(50) NOT NULL,
  price_per_hour NUMERIC(10, 2) NOT NULL CHECK (price_per_hour >= 0),
  capacity INT NOT NULL DEFAULT 2 CHECK (capacity > 0),
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE court_availability (
  id SERIAL PRIMARY KEY,
  court_id INT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CHECK (start_time < end_time)
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  player_id INT REFERENCES users(id) ON DELETE CASCADE,
  court_id INT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  coach_id INT REFERENCES coach_profiles(user_id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_time < end_time),
  CHECK (player_id IS NOT NULL OR coach_id IS NOT NULL)
);

CREATE TABLE player_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  sport_type VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  skill_level VARCHAR(30) NOT NULL,
  description TEXT DEFAULT '',
  max_members INT NOT NULL DEFAULT 10 CHECK (max_members > 1),
  created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_join_requests (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES player_groups(id) ON DELETE CASCADE,
  requester_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  UNIQUE (group_id, requester_id)
);

CREATE TABLE group_members (
  group_id INT NOT NULL REFERENCES player_groups(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (member_role IN ('captain', 'member')),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE group_messages (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES player_groups(id) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL CHECK (length(trim(message_text)) > 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id INT REFERENCES coach_profiles(user_id) ON DELETE CASCADE,
  court_id INT REFERENCES courts(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (coach_id IS NOT NULL AND court_id IS NULL)
    OR
    (coach_id IS NULL AND court_id IS NOT NULL)
  )
);

CREATE INDEX idx_bookings_court_time ON bookings (court_id, booking_date, start_time, end_time);
CREATE INDEX idx_bookings_coach_time ON bookings (coach_id, booking_date, start_time, end_time);
CREATE INDEX idx_bookings_player_time ON bookings (player_id, booking_date, start_time, end_time);
CREATE INDEX idx_group_join_requests_requester_status ON group_join_requests (requester_id, status, created_at);
CREATE INDEX idx_group_join_requests_group_status ON group_join_requests (group_id, status, created_at);
CREATE INDEX idx_group_messages_group_time ON group_messages (group_id, created_at);
