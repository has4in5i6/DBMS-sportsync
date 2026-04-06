const db = require('../db');

const createReview = async ({ reviewerId, coachId, courtId, rating, comment }) => {
  const result = await db.query(
    `INSERT INTO reviews (reviewer_id, coach_id, court_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [reviewerId, coachId || null, courtId || null, rating, comment || ''],
  );

  return result.rows[0];
};

const getReviews = async ({ coachId, courtId }) => {
  const params = [];
  const conditions = [];

  if (coachId) {
    params.push(coachId);
    conditions.push(`r.coach_id = $${params.length}`);
  }

  if (courtId) {
    params.push(courtId);
    conditions.push(`r.court_id = $${params.length}`);
  }

  const result = await db.query(
    `SELECT
      r.*,
      reviewer.full_name AS reviewer_name
     FROM reviews r
     JOIN users reviewer ON reviewer.id = r.reviewer_id
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY r.created_at DESC`,
    params,
  );

  return result.rows;
};

module.exports = {
  createReview,
  getReviews,
};
