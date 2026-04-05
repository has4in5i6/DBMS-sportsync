module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
  req.user = { id: 1, role: 'player' }; // placeholder; replace with real auth logic
  next();
};
