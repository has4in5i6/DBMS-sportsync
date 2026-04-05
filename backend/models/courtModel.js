const db = require('../db');

exports.listAllCourts = async () => {
  const result = await db.query('SELECT * FROM courts');
  return result.rows;
};

exports.getCourtById = async (courtId) => {
  const result = await db.query('SELECT * FROM courts WHERE id = $1', [courtId]);
  return result.rows[0];
};
