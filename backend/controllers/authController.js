const { findUserByEmail, createUser } = require('../models/userModel');

exports.login = async (req, res) => {
  const { email } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  return res.json({ user });
};

exports.signup = async (req, res) => {
  const user = await createUser(req.body);
  res.status(201).json({ user });
};
