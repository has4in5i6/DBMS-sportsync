const express = require('express');
const { requireAuth, requireRole } = require('../middleware/accessControl');
const {
  addMyAvailability,
  deleteMyAvailability,
  getCoach,
  getMyCoachDashboard,
  listCoaches,
} = require('../controllers/coachController');

const router = express.Router();

router.get('/', listCoaches);
router.get('/me/dashboard', requireAuth, requireRole('coach'), getMyCoachDashboard);
router.post('/me/availability', requireAuth, requireRole('coach'), addMyAvailability);
router.delete('/me/availability/:availabilityId', requireAuth, requireRole('coach'), deleteMyAvailability);
router.get('/:coachId', getCoach);

module.exports = router;
