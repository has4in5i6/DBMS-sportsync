const bcrypt = require('bcrypt');
const {
  createUser,
  findUserByEmail,
  findUserByUsername,
} = require('../models/userModel');

const buildSessionUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.full_name,
  role: user.role,
});

const signup = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      role = 'player',
      primarySport = 'Badminton',
      skillLevel = 'Beginner',
      city = 'Hyderabad',
      bio = '',
    } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: 'Full name, username, email, and password are required.' });
    }

    if (!['player', 'coach', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
      username,
      email,
      passwordHash,
      fullName,
      role,
      primarySport,
      skillLevel,
      city,
      bio,
    });

    req.session.user = buildSessionUser(user);
    return res.status(201).json({ user: req.session.user });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    req.session.user = buildSessionUser(user);
    return res.json({ user: req.session.user });
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully.' });
  });
};

const getSession = (req, res) => {
  res.json({
    loggedIn: Boolean(req.session.user),
    user: req.session.user || null,
  });
};

module.exports = {
  getSession,
  login,
  logout,
  signup,
};
