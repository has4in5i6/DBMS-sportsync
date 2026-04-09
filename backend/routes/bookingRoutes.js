                                                                                                            const express = require('express');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const {
  cancelExistingBooking,
  createNewBooking,
  getBookingAvailability,
  getCoachManagedBookings,
  getMyBookings,
  getOwnerManagedBookings,
} = require('../controllers/bookingController');

const router = express.Router();

router.use(auth);
router.get('/availability', requireRole('player'), getBookingAvailability);
router.get('/mine', requireRole('player'), getMyBookings);
router.get('/owner', requireRole('owner'), getOwnerManagedBookings);
router.get('/coach', requireRole('coach'), getCoachManagedBookings);
router.post('/', requireRole('player'), createNewBooking);
router.patch('/:bookingId/cancel', cancelExistingBooking);

module.exports = router;
