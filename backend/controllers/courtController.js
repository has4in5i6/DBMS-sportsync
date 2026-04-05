const { listAllCourts, getCourtById } = require('../models/courtModel');

exports.listCourts = async (req, res) => {
  const courts = await listAllCourts();
  res.json({ courts });
};

exports.getCourtDetails = async (req, res) => {
  const court = await getCourtById(req.params.courtId);
  res.json({ court });
};
