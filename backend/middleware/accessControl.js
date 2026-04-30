const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Please log in first.' });
  }

  return next();
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  const userRole = req.session.user?.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'You do not have access to this action.' });
  }

  return next();
};

module.exports = {
  requireAuth,
  requireRole,
};
