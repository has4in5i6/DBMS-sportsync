const db = require('../db');

exports.listAllCourts = async () => {
  const result = await db.query('SELECT * FROM courts');
  return result.rows;
};

exports.getCourtById = async (courtId) => {
  const result = await db.query('SELECT * FROM courts WHERE id = $1', [courtId]);
  return result.rows[0];
};

// TODO: Add search and filter functions for courts (by location, sport, availability)
// exports.searchCourts = async (filters) => {
//   // Build dynamic query based on filters
// };
