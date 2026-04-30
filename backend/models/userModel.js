const db = require('../db');

const baseProfileQuery = `
  SELECT
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.role,
    u.primary_sport,
    u.skill_level,
    u.city,
    u.bio,
    u.availability_notes,
    cp.experience_years,
    cp.hourly_rate,
    cp.coaching_history
  FROM users u
  LEFT JOIN coach_profiles cp ON cp.user_id = u.id
`;

const findUserByUsername = async (username) => {
  const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

const findUserByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const createUser = async ({
  username,
  email,
  passwordHash,
  fullName,
  role,
  primarySport = 'Badminton',
  skillLevel = 'Beginner',
  city = 'Hyderabad',
  bio = '',
}) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO users (
        username,
        email,
        password_hash,
        full_name,
        role,
        primary_sport,
        skill_level,
        city,
        bio
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, username, full_name, role`,
      [username, email, passwordHash, fullName, role, primarySport, skillLevel, city, bio],
    );

    if (role === 'coach') {
      await client.query(
        `INSERT INTO coach_profiles (user_id, experience_years, hourly_rate, coaching_history)
         VALUES ($1, 0, 0, '')`,
        [result.rows[0].id],
      );
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getUserProfileById = async (userId) => {
  const result = await db.query(`${baseProfileQuery} WHERE u.id = $1`, [userId]);
  return result.rows[0] || null;
};

const updateUserProfile = async (userId, fields) => {
  const {
    fullName,
    email,
    primarySport,
    skillLevel,
    city,
    bio,
    availabilityNotes,
    experienceYears,
    hourlyRate,
    coachingHistory,
  } = fields;

  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users
       SET full_name = $1,
           email = $2,
           primary_sport = $3,
           skill_level = $4,
           city = $5,
           bio = $6,
           availability_notes = $7
       WHERE id = $8`,
      [fullName, email, primarySport, skillLevel, city, bio, availabilityNotes, userId],
    );

    const roleRow = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (roleRow.rows[0]?.role === 'coach') {
      await client.query(
        `INSERT INTO coach_profiles (user_id, experience_years, hourly_rate, coaching_history)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id)
         DO UPDATE SET
           experience_years = EXCLUDED.experience_years,
           hourly_rate = EXCLUDED.hourly_rate,
           coaching_history = EXCLUDED.coaching_history`,
        [userId, experienceYears || 0, hourlyRate || 0, coachingHistory || ''],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getUserProfileById(userId);
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByUsername,
  getUserProfileById,
  updateUserProfile,
};
