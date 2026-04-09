const {
  addCourtAvailability,
  createCourt,
  deleteCourt,
  getCourtAvailability,
  getCourtById,
  listOwnerCourts,
  searchCourts,
  updateCourt,
} = require('../models/courtModel');

const listCourts = async (req, res, next) => {
  try {
    const courts = await searchCourts(req.query);
    return res.json({ courts });
  } catch (error) {
    return next(error);
  }
};

const getCourt = async (req, res, next) => {
  try {
    const court = await getCourtById(req.params.courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found.' });
    }

    const availability = await getCourtAvailability(req.params.courtId);
    return res.json({ court, availability });
  } catch (error) {
    return next(error);
  }
};

const getMyCourts = async (req, res, next) => {
  try {
    const courts = await listOwnerCourts(req.session.user.id);
    return res.json({ courts });
  } catch (error) {
    return next(error);
  }
};

const createMyCourt = async (req, res, next) => {
  try {
    const court = await createCourt(req.session.user.id, req.body);
    return res.status(201).json({ court });
  } catch (error) {
    return next(error);
  }
};

const updateMyCourt = async (req, res, next) => {
  try {
    const court = await updateCourt(req.session.user.id, req.params.courtId, req.body);
    if (!court) {
      return res.status(404).json({ message: 'Court not found or not owned by you.' });
    }

    return res.json({ court });
  } catch (error) {
    return next(error);
  }
};

const addMyCourtAvailability = async (req, res, next) => {
  try {
    const ownedCourt = await getCourtById(req.params.courtId);
    if (!ownedCourt || ownedCourt.owner_id !== req.session.user.id) {
      return res.status(403).json({ message: 'You can only manage your own courts.' });
    }

    const availability = await addCourtAvailability(req.params.courtId, req.body);
    return res.status(201).json({ availability });
  } catch (error) {
    return next(error);
  }
};

const deleteMyCourt = async (req, res, next) => {
  try {
    const court = await deleteCourt(req.session.user.id, req.params.courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found or not owned by you.' });
    }

    return res.json({ court, message: 'Court deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addMyCourtAvailability,
  createMyCourt,
  deleteMyCourt,
  getCourt,
  getMyCourts,
  listCourts,
  updateMyCourt,
};
