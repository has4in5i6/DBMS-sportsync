const express = require('express');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const {
  addMyAvailability,
  deleteMyAvailability,
  getCoach,
  getMyCoachDashboard,
  listCoaches,
} = require('../controllers/coachController');

const router = express.Router();

router.get('/', listCoaches);
router.get('/me/dashboard', auth, requireRole('coach'), getMyCoachDashboard);
router.post('/me/availability', auth, requireRole('coach'), addMyAvailability);
router.delete('/me/availability/:availabilityId', auth, requireRole('coach'), deleteMyAvailability);
router.get('/:coachId', getCoach);

module.exports = router;
