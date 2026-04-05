const bcrypt = require('bcrypt');
const db = require('../db');

exports.signup = async (req, res) => {
  const { username, password, email, name, role } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (username, password_hash, email, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username`,
      [username, hash, email, name, role || 'player']
    );

    req.session.user = {
      user_id: result.rows[0].id,
      username: result.rows[0].username
    };

    res.status(201).json({
      user_id: result.rows[0].id,
      username: result.rows[0].username
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query(
      `SELECT id, username, password_hash
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User Not Found' });
    }

    const valid = await bcrypt.compare(
      password,
      result.rows[0].password_hash
    );

    if (!valid) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    req.session.user = {
      user_id: result.rows[0].id,
      username: result.rows[0].username
    };

    res.json({ message: 'Login successful', user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
};

exports.isLoggedIn = (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
};
