const db = require('../db');

exports.findUserByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

exports.createUser = async ({ name, username, email, password, role }) => {
  const result = await db.query('INSERT INTO users (name, username, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id', [name, username, email, password, role]);
  return { id: result.rows[0].user_id, name, username, email, role };
};

exports.getUserById = async (userId) => {
  const result = await db.query('SELECT user_id, name, username, email, role FROM users WHERE user_id = $1', [userId]);
  return result.rows[0];
};

exports.updateUser = async (userId, fields) => {
  await db.query('UPDATE users SET name = $1, username = $2, email = $3 WHERE user_id = $4', [fields.name, fields.username, fields.email, userId]);
  return exports.getUserById(userId);
};
