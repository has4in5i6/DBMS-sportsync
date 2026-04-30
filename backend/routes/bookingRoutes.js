const express = require('express');
const { requireAuth, requireRole } = require('../middleware/accessControl');
const {
  cancelExistingBooking,
  createNewBooking,
  getBookingAvailability,
  getCoachManagedBookings,
  getMyBookings,
  getOwnerManagedBookings,
} = require('../controllers/bookingController');

const router = express.Router();

router.use(requireAuth);
router.get('/availability', requireRole('player', 'coach'), getBookingAvailability);
router.get('/mine', requireRole('player', 'coach'), getMyBookings);
router.get('/owner', requireRole('owner'), getOwnerManagedBookings);
router.get('/coach', requireRole('coach'), getCoachManagedBookings);
router.post('/', requireRole('player', 'coach'), createNewBooking);
router.patch('/:bookingId/cancel', cancelExistingBooking);

module.exports = router;
