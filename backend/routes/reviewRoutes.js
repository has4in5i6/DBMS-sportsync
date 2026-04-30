const express = require('express');
const { requireAuth } = require('../middleware/accessControl');
const { createMyReview, getMyReviewTargets, listReviews } = require('../controllers/reviewController');

const router = express.Router();

router.get('/', listReviews);
router.get('/mine/targets', requireAuth, getMyReviewTargets);
router.post('/', requireAuth, createMyReview);

module.exports = router;
