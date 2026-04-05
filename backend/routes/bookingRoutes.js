const express = require('express');
const { createBooking, getBookings, cancelBooking } = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);
router.post('/', createBooking);
router.get('/', getBookings);
router.delete('/:bookingId', cancelBooking);

module.exports = router;
