const { getUserProfileById, updateUserProfile } = require('../models/userModel');
const { getPlayerBookings, getCoachBookings, getOwnerBookings } = require('../models/bookingModel');
const { listGroupsForUser } = require('../models/groupModel');

const getMe = async (req, res, next) => {
  try {
    const user = await getUserProfileById(req.session.user.id);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const user = await updateUserProfile(req.session.user.id, req.body);
    req.session.user.fullName = user.full_name;
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

const getMyOverview = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const role = req.session.user.role;

    let bookings = [];
    if (role === 'player') {
      bookings = await getPlayerBookings(userId);
    } else if (role === 'coach') {
      bookings = await getCoachBookings(userId);
    } else if (role === 'owner') {
      bookings = await getOwnerBookings(userId);
    }

    const groups = role === 'player' ? await listGroupsForUser(userId) : [];

    return res.json({
      stats: {
        bookingsCount: bookings.length,
        groupsCount: groups.length,
      },
      bookings: bookings.slice(0, 5),
      groups,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMe,
  getMyOverview,
  updateMe,
};
