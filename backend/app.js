const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courtRoutes = require('./routes/courtRoutes');
const coachRoutes = require('./routes/coachRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const groupRoutes = require('./routes/groupRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(session({
  name: 'sportsync.sid',
  secret: process.env.SESSION_SECRET || 'sportsync_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/reviews', reviewRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`SportSync backend running on http://localhost:${port}`);
});
