const {
  createReview,
  getReviewTargetsForUser,
  hasCoachBookedCourt,
  getReviews,
  hasUserBookedCoach,
  hasUserBookedCourt,
} = require('../models/reviewModel');

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
    const { id: userId, role } = req.session.user;

    if (!rating || (!coachId && !courtId)) {
      return res.status(400).json({ message: 'A rating and one review target are required.' });
    }

    if (coachId && courtId) {
      return res.status(400).json({ message: 'Select either a coach or a court for the review.' });
    }

    if (coachId) {
      if (role === 'coach') {
        return res.status(403).json({ message: 'Coaches can only review courts.' });
      }

      const hasBookedCoach = await hasUserBookedCoach({
        userId,
        coachId,
      });

      if (!hasBookedCoach) {
        return res.status(403).json({ message: 'You can only review coaches you have booked with.' });
      }
    }

    if (courtId) {
      const hasBookedCourt = role === 'coach'
        ? await hasCoachBookedCourt({ coachId: userId, courtId })
        : await hasUserBookedCourt({ userId, courtId });

      if (!hasBookedCourt) {
        return res.status(403).json({ message: 'You can only review courts you have booked.' });
      }
    }

    const review = await createReview({
      reviewerId: userId,
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

const getMyReviewTargets = async (req, res, next) => {
  try {
    const targets = await getReviewTargetsForUser(req.session.user.id, req.session.user.role);
    return res.json(targets);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createMyReview,
  getMyReviewTargets,
  listReviews,
};
