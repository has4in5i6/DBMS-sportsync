const express = require('express');
const auth = require('../middleware/authMiddleware');
const { createMyReview, getMyReviewTargets, listReviews } = require('../controllers/reviewController');

const router = express.Router();

router.get('/', listReviews);
router.get('/mine/targets', auth, getMyReviewTargets);
router.post('/', auth, createMyReview);

module.exports = router;
