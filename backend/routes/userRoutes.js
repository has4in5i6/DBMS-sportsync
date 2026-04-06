const express = require('express');
const auth = require('../middleware/authMiddleware');
const { getMe, getMyOverview, updateMe } = require('../controllers/userController');

const router = express.Router();

router.use(auth);
router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/me/overview', getMyOverview);

module.exports = router;
