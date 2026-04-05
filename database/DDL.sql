CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(150),
  name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'player'
);

CREATE TABLE courts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  surface VARCHAR(50),
  price_per_hour DECIMAL(10,2)
);

CREATE TABLE coaches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100),
  hourly_rate DECIMAL(10,2)
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  court_id INT NOT NULL,
  coach_id INT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (court_id) REFERENCES courts(id),
  FOREIGN KEY (coach_id) REFERENCES coaches(id)
);
