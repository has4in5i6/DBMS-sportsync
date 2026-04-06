module.exports = (...allowedRoles) => (req, res, next) => {
  const userRole = req.session.user?.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'You do not have access to this action.' });
  }

  return next();
};
