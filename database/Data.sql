INSERT INTO users (name, email, password, role) VALUES
('Alice Player', 'alice@example.com', 'password123', 'player'),
('Ben Coach', 'ben@example.com', 'password123', 'coach'),
('Olivia Owner', 'olivia@example.com', 'password123', 'owner');

INSERT INTO courts (name, location, surface, price_per_hour) VALUES
('Court A', 'Downtown', 'Hard', 30.00),
('Court B', 'Uptown', 'Clay', 35.00);

INSERT INTO coaches (name, specialty, hourly_rate) VALUES
('Ben Coach', 'Tennis', 50.00);
