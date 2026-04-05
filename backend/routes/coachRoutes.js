const express = require('express');
const { getCoachSchedule } = require('../controllers/bookingController');
const router = express.Router();

router.get('/:coachId/schedule', getCoachSchedule);

module.exports = router;
