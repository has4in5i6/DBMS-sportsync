const express = require('express');
const { requireAuth, requireRole } = require('../middleware/accessControl');
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
router.get('/owner/mine', requireAuth, requireRole('owner'), getMyCourts);
router.post('/', requireAuth, requireRole('owner'), createMyCourt);
router.put('/:courtId', requireAuth, requireRole('owner'), updateMyCourt);
router.delete('/:courtId', requireAuth, requireRole('owner'), deleteMyCourt);
router.delete('/:courtId/availability/:availabilityId', requireAuth, requireRole('owner'), deleteMyCourtAvailability);
router.get('/:courtId', getCourt);
router.post('/:courtId/availability', requireAuth, requireRole('owner'), addMyCourtAvailability);

module.exports = router;
