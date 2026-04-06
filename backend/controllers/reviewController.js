const { createReview, getReviews } = require('../models/reviewModel');

const listReviews = async (req, res, next) => {
  try {
    const reviews = await getReviews(req.query);
    return res.json({ reviews });
  } catch (error) {
    return next(error);
  }
};

const createMyReview = async (req, res, next) => {
  try {
    const { coachId, courtId, rating, comment } = req.body;

    if (!rating || (!coachId && !courtId)) {
      return res.status(400).json({ message: 'A rating and one review target are required.' });
    }

    const review = await createReview({
      reviewerId: req.session.user.id,
      coachId,
      courtId,
      rating,
      comment,
    });

    return res.status(201).json({ review });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createMyReview,
  listReviews,
};
