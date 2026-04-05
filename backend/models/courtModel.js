const db = require('../db');

exports.listAllCourts = async () => {
  const [rows] = await db.query('SELECT * FROM courts');
  return rows;
};

exports.getCourtById = async (courtId) => {
  const [rows] = await db.query('SELECT * FROM courts WHERE id = ?', [courtId]);
  return rows[0];
};
