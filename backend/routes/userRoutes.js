const express = require('express');
const { requireAuth } = require('../middleware/accessControl');
const { getMe, getMyOverview, updateMe } = require('../controllers/userController');

const router = express.Router();

router.use(requireAuth);
router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/me/overview', getMyOverview);

module.exports = router;
