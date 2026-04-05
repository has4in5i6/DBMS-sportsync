const db = require('../db');

exports.getCoachById = async (coachId) => {
  const [rows] = await db.query('SELECT * FROM coaches WHERE id = ?', [coachId]);
  return rows[0];
};
