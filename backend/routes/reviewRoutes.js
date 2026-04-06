const express = require('express');
const auth = require('../middleware/authMiddleware');
const { createMyReview, listReviews } = require('../controllers/reviewController');

const router = express.Router();

router.get('/', listReviews);
router.post('/', auth, createMyReview);

module.exports = router;
