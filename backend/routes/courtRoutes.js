const express = require('express');
const { listCourts, getCourtDetails } = require('../controllers/courtController');
const router = express.Router();

router.get('/', listCourts);
router.get('/:courtId', getCourtDetails);

module.exports = router;
