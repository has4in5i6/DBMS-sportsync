const { getUserById, updateUser } = require('../models/userModel');

exports.getUserProfile = async (req, res) => {
  const user = await getUserById(req.user.id);
  res.json({ user });
};

exports.updateUserProfile = async (req, res) => {
  const updated = await updateUser(req.user.id, req.body);
  res.json({ user: updated });
};
