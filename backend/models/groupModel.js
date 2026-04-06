const db = require('../db');

const listGroups = async () => {
  const result = await db.query(
    `SELECT
      g.*,
      creator.full_name AS creator_name,
      COUNT(gm.user_id)::int AS member_count
     FROM player_groups g
     JOIN users creator ON creator.id = g.created_by
     LEFT JOIN group_members gm ON gm.group_id = g.id
     GROUP BY g.id, creator.full_name
     ORDER BY g.name ASC`,
  );

  return result.rows;
};

const getGroupById = async (groupId, userId = null) => {
  const params = [groupId];
  const membershipJoin = userId
    ? `LEFT JOIN group_members viewer_membership
         ON viewer_membership.group_id = g.id
        AND viewer_membership.user_id = $2`
    : '';

  if (userId) {
    params.push(userId);
  }

  const result = await db.query(
    `SELECT
      g.*,
      creator.full_name AS creator_name,
      COUNT(all_members.user_id)::int AS member_count,
      ${userId ? 'viewer_membership.user_id IS NOT NULL' : 'FALSE'} AS is_member
     FROM player_groups g
     JOIN users creator ON creator.id = g.created_by
     LEFT JOIN group_members all_members ON all_members.group_id = g.id
     ${membershipJoin}
     WHERE g.id = $1
     GROUP BY g.id, creator.full_name${userId ? ', viewer_membership.user_id' : ''}
    `,
    params,
  );

  return result.rows[0] || null;
};

const getGroupMembers = async (groupId) => {
  const result = await db.query(
    `SELECT
      gm.group_id,
      gm.member_role,
      gm.joined_at,
      u.id,
      u.full_name,
      u.username,
      u.primary_sport,
      u.skill_level,
      u.city
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY
       CASE WHEN gm.member_role = 'captain' THEN 0 ELSE 1 END,
       u.full_name ASC`,
    [groupId],
  );

  return result.rows;
};

const isGroupMember = async (groupId, userId) => {
  const result = await db.query(
    `SELECT 1
     FROM group_members
     WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId],
  );

  return result.rows.length > 0;
};

const getGroupMessages = async (groupId) => {
  const result = await db.query(
    `SELECT
      gm.id,
      gm.group_id,
      gm.sender_id,
      gm.message_text,
      gm.created_at,
      u.full_name AS sender_name,
      u.username AS sender_username
     FROM group_messages gm
     JOIN users u ON u.id = gm.sender_id
     WHERE gm.group_id = $1
     ORDER BY gm.created_at ASC, gm.id ASC`,
    [groupId],
  );

  return result.rows;
};

const addGroupMessage = async (groupId, userId, messageText) => {
  const result = await db.query(
    `INSERT INTO group_messages (group_id, sender_id, message_text)
     VALUES ($1, $2, $3)
     RETURNING id, group_id, sender_id, message_text, created_at`,
    [groupId, userId, messageText.trim()],
  );

  return result.rows[0];
};

const listGroupsForUser = async (userId) => {
  const result = await db.query(
    `SELECT
      g.*,
      creator.full_name AS creator_name,
      COUNT(all_members.user_id)::int AS member_count
     FROM group_members gm
     JOIN player_groups g ON g.id = gm.group_id
     JOIN users creator ON creator.id = g.created_by
     LEFT JOIN group_members all_members ON all_members.group_id = g.id
     WHERE gm.user_id = $1
     GROUP BY g.id, creator.full_name
     ORDER BY g.name ASC`,
    [userId],
  );

  return result.rows;
};

const createGroup = async (userId, group) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const groupResult = await client.query(
      `INSERT INTO player_groups (
        name,
        sport_type,
        city,
        skill_level,
        description,
        max_members,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        group.name,
        group.sportType,
        group.city,
        group.skillLevel,
        group.description,
        group.maxMembers,
        userId,
      ],
    );

    await client.query(
      `INSERT INTO group_members (group_id, user_id, member_role)
       VALUES ($1, $2, 'captain')`,
      [groupResult.rows[0].id, userId],
    );

    await client.query('COMMIT');
    return groupResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const joinGroup = async (groupId, userId) => {
  const groupResult = await db.query(
    `SELECT
      g.id,
      g.max_members,
      COUNT(gm.user_id)::int AS member_count
     FROM player_groups g
     LEFT JOIN group_members gm ON gm.group_id = g.id
     WHERE g.id = $1
     GROUP BY g.id`,
    [groupId],
  );

  const group = groupResult.rows[0];
  if (!group) {
    const error = new Error('Group not found.');
    error.status = 404;
    throw error;
  }

  if (group.member_count >= group.max_members) {
    const error = new Error('This group is already full.');
    error.status = 409;
    throw error;
  }

  const result = await db.query(
    `INSERT INTO group_members (group_id, user_id, member_role)
     VALUES ($1, $2, 'member')
     ON CONFLICT (group_id, user_id) DO NOTHING
     RETURNING *`,
    [groupId, userId],
  );

  return result.rows[0] || null;
};

module.exports = {
  addGroupMessage,
  createGroup,
  getGroupById,
  getGroupMembers,
  getGroupMessages,
  isGroupMember,
  joinGroup,
  listGroups,
  listGroupsForUser,
};
