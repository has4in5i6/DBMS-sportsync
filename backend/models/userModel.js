const db = require('../db');

exports.findUserByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

exports.createUser = async ({ name, email, password, role }) => {
  const [result] = await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role]);
  return { id: result.insertId, name, email, role };
};

exports.getUserById = async (userId) => {
  const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
  return rows[0];
};

exports.updateUser = async (userId, fields) => {
  await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [fields.name, fields.email, userId]);
  return exports.getUserById(userId);
};
