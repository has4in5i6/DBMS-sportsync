-- Sample queries for the Sportsync database
SELECT * FROM users;
SELECT * FROM courts;
SELECT * FROM coaches;
SELECT b.*, u.name AS user_name, c.name AS court_name, h.name AS coach_name
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN courts c ON b.court_id = c.id
LEFT JOIN coaches h ON b.coach_id = h.id;
