const express = require('express');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const {
  addMyCourtAvailability,
  createMyCourt,
  deleteMyCourtAvailability,
  deleteMyCourt,
  getCourt,
  getMyCourts,
  listCourts,
  updateMyCourt,
} = require('../controllers/courtController');

const router = express.Router();

router.get('/', listCourts);
router.get('/owner/mine', auth, requireRole('owner'), getMyCourts);
router.post('/', auth, requireRole('owner'), createMyCourt);
router.put('/:courtId', auth, requireRole('owner'), updateMyCourt);
router.delete('/:courtId', auth, requireRole('owner'), deleteMyCourt);
router.delete('/:courtId/availability/:availabilityId', auth, requireRole('owner'), deleteMyCourtAvailability);
router.get('/:courtId', getCourt);
router.post('/:courtId/availability', auth, requireRole('owner'), addMyCourtAvailability);

module.exports = router;
