const db = require('../db');

exports.getCoachById = async (coachId) => {
  const result = await db.query('SELECT * FROM coaches WHERE id = $1', [coachId]);
  return result.rows[0];
};
