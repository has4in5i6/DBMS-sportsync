const db = require('../db');

const buildViewerFields = (userId, userIdParam = '$1') => ({
  membershipJoin: userId
    ? `LEFT JOIN group_members viewer_membership
         ON viewer_membership.group_id = g.id
        AND viewer_membership.user_id = ${userIdParam}`
    : '',
  requestJoin: userId
    ? `LEFT JOIN group_join_requests viewer_request
         ON viewer_request.group_id = g.id
        AND viewer_request.requester_id = ${userIdParam}`
    : '',
  viewerSelect: userId
    ? `
      viewer_membership.user_id IS NOT NULL AS is_member,
      g.created_by = ${userIdParam} AS is_creator,
      viewer_request.status AS join_request_status`
    : `
      FALSE AS is_member,
      FALSE AS is_creator,
      NULL::varchar AS join_request_status`,
  viewerGroupBy: userId ? ', viewer_membership.user_id, viewer_request.status' : '',
});

const listGroups = async (userId = null) => {
  const params = [];
  if (userId) {
    params.push(userId);
  }

  const { membershipJoin, requestJoin, viewerSelect, viewerGroupBy } = buildViewerFields(userId);
  const result = await db.query(
    `SELECT
      g.*,
      creator.full_name AS creator_name,
      COUNT(gm.user_id)::int AS member_count,
      ${viewerSelect}
     FROM player_groups g
     JOIN users creator ON creator.id = g.created_by
     LEFT JOIN group_members gm ON gm.group_id = g.id
     ${membershipJoin}
     ${requestJoin}
     GROUP BY g.id, creator.full_name${viewerGroupBy}
     ORDER BY g.name ASC`,
    params,
  );

  return result.rows;
};

const getGroupById = async (groupId, userId = null) => {
  const params = [groupId];
  const userIdParam = userId ? '$2' : null;
  if (userId) {
    params.push(userId);
  }

  const { membershipJoin, requestJoin, viewerSelect, viewerGroupBy } = buildViewerFields(userId, userIdParam);
  const result = await db.query(
    `SELECT
      g.*,
      creator.full_name AS creator_name,
      COUNT(all_members.user_id)::int AS member_count,
      ${viewerSelect}
     FROM player_groups g
     JOIN users creator ON creator.id = g.created_by
     LEFT JOIN group_members all_members ON all_members.group_id = g.id
     ${membershipJoin}
     ${requestJoin}
     WHERE g.id = $1
     GROUP BY g.id, creator.full_name${viewerGroupBy}`,
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

const listJoinRequestsForUser = async (userId) => {
  const result = await db.query(
    `SELECT
      gjr.*,
      g.name,
      g.sport_type,
      g.city,
      g.skill_level,
      g.max_members,
      g.created_by,
      creator.full_name AS creator_name,
      COUNT(gm.user_id)::int AS member_count
     FROM group_join_requests gjr
     JOIN player_groups g ON g.id = gjr.group_id
     JOIN users creator ON creator.id = g.created_by
     LEFT JOIN group_members gm ON gm.group_id = g.id
     WHERE gjr.requester_id = $1
     GROUP BY gjr.id, g.id, creator.full_name
     ORDER BY
       CASE gjr.status
         WHEN 'pending' THEN 0
         WHEN 'rejected' THEN 1
         ELSE 2
       END,
       gjr.created_at DESC`,
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

const createJoinRequest = async (groupId, userId) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const groupResult = await client.query(
      `SELECT
        g.id,
        g.created_by,
        g.max_members
       FROM player_groups g
       WHERE g.id = $1
       FOR UPDATE`,
      [groupId],
    );

    const group = groupResult.rows[0];
    if (!group) {
      const error = new Error('Group not found.');
      error.status = 404;
      throw error;
    }

    if (Number(group.created_by) === Number(userId)) {
      const error = new Error('You cannot send a join request to your own group.');
      error.status = 409;
      throw error;
    }

    const [memberCountResult, existingMembershipResult, existingRequestResult] = await Promise.all([
      client.query(
        `SELECT COUNT(*)::int AS member_count
         FROM group_members
         WHERE group_id = $1`,
        [groupId],
      ),
      client.query(
        `SELECT 1
         FROM group_members
         WHERE group_id = $1 AND user_id = $2`,
        [groupId, userId],
      ),
      client.query(
        `SELECT id, status
         FROM group_join_requests
         WHERE group_id = $1 AND requester_id = $2`,
        [groupId, userId],
      ),
    ]);

    if (existingMembershipResult.rows.length > 0) {
      const error = new Error('You are already a member of this group.');
      error.status = 409;
      throw error;
    }

    const existingRequest = existingRequestResult.rows[0];
    if (existingRequest) {
      const error = new Error(
        existingRequest.status === 'pending'
          ? 'Your join request is already pending approval.'
          : existingRequest.status === 'rejected'
            ? 'Your previous join request was rejected. Clear it before sending a new request.'
            : 'Your request has already been accepted.',
      );
      error.status = 409;
      throw error;
    }

    const memberCount = Number(memberCountResult.rows[0]?.member_count || 0);
    if (memberCount >= Number(group.max_members)) {
      const error = new Error('This group is already full.');
      error.status = 409;
      throw error;
    }

    const requestResult = await client.query(
      `INSERT INTO group_join_requests (group_id, requester_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [groupId, userId],
    );

    await client.query('COMMIT');
    return requestResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listPendingJoinRequestsForGroup = async (groupId, creatorId) => {
  const groupResult = await db.query(
    `SELECT id
     FROM player_groups
     WHERE id = $1 AND created_by = $2`,
    [groupId, creatorId],
  );

  if (!groupResult.rows[0]) {
    const error = new Error('You do not have access to these join requests.');
    error.status = 403;
    throw error;
  }

  const result = await db.query(
    `SELECT
      gjr.id,
      gjr.group_id,
      gjr.requester_id,
      gjr.status,
      gjr.created_at,
      u.full_name,
      u.username,
      u.primary_sport,
      u.skill_level,
      u.city
     FROM group_join_requests gjr
     JOIN users u ON u.id = gjr.requester_id
     WHERE gjr.group_id = $1
       AND gjr.status = 'pending'
     ORDER BY gjr.created_at ASC`,
    [groupId],
  );

  return result.rows;
};

const acceptJoinRequest = async (requestId, approverId) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      `SELECT id, group_id, requester_id, status
       FROM group_join_requests
       WHERE id = $1
       FOR UPDATE`,
      [requestId],
    );

    const joinRequest = requestResult.rows[0];
    if (!joinRequest) {
      const error = new Error('Join request not found.');
      error.status = 404;
      throw error;
    }

    if (joinRequest.status !== 'pending') {
      const error = new Error('Only pending join requests can be accepted.');
      error.status = 409;
      throw error;
    }

    const groupResult = await client.query(
      `SELECT id, created_by, max_members
       FROM player_groups
       WHERE id = $1
       FOR UPDATE`,
      [joinRequest.group_id],
    );

    const group = groupResult.rows[0];
    if (!group) {
      const error = new Error('Group not found.');
      error.status = 404;
      throw error;
    }

    if (Number(group.created_by) !== Number(approverId)) {
      const error = new Error('Only the group creator can accept join requests.');
      error.status = 403;
      throw error;
    }

    const [memberCountResult, membershipResult] = await Promise.all([
      client.query(
        `SELECT COUNT(*)::int AS member_count
         FROM group_members
         WHERE group_id = $1`,
        [joinRequest.group_id],
      ),
      client.query(
        `SELECT 1
         FROM group_members
         WHERE group_id = $1 AND user_id = $2`,
        [joinRequest.group_id, joinRequest.requester_id],
      ),
    ]);

    if (membershipResult.rows.length > 0) {
      const error = new Error('This player is already a member of the group.');
      error.status = 409;
      throw error;
    }

    const memberCount = Number(memberCountResult.rows[0]?.member_count || 0);
    if (memberCount >= Number(group.max_members)) {
      const error = new Error('This group is already full.');
      error.status = 409;
      throw error;
    }

    await client.query(
      `INSERT INTO group_members (group_id, user_id, member_role)
       VALUES ($1, $2, 'member')`,
      [joinRequest.group_id, joinRequest.requester_id],
    );

    const updatedRequestResult = await client.query(
      `UPDATE group_join_requests
       SET status = 'accepted',
           reviewed_at = CURRENT_TIMESTAMP,
           reviewed_by = $2
       WHERE id = $1
       RETURNING *`,
      [requestId, approverId],
    );

    await client.query('COMMIT');
    return updatedRequestResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const rejectJoinRequest = async (requestId, approverId) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      `SELECT id, group_id, status
       FROM group_join_requests
       WHERE id = $1
       FOR UPDATE`,
      [requestId],
    );

    const joinRequest = requestResult.rows[0];
    if (!joinRequest) {
      const error = new Error('Join request not found.');
      error.status = 404;
      throw error;
    }

    if (joinRequest.status !== 'pending') {
      const error = new Error('Only pending join requests can be rejected.');
      error.status = 409;
      throw error;
    }

    const groupResult = await client.query(
      `SELECT id, created_by
       FROM player_groups
       WHERE id = $1`,
      [joinRequest.group_id],
    );

    const group = groupResult.rows[0];
    if (!group) {
      const error = new Error('Group not found.');
      error.status = 404;
      throw error;
    }

    if (Number(group.created_by) !== Number(approverId)) {
      const error = new Error('Only the group creator can reject join requests.');
      error.status = 403;
      throw error;
    }

    const updatedRequestResult = await client.query(
      `UPDATE group_join_requests
       SET status = 'rejected',
           reviewed_at = CURRENT_TIMESTAMP,
           reviewed_by = $2
       WHERE id = $1
       RETURNING *`,
      [requestId, approverId],
    );

    await client.query('COMMIT');
    return updatedRequestResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const clearRejectedJoinRequest = async (requestId, requesterId) => {
  const result = await db.query(
    `DELETE FROM group_join_requests
     WHERE id = $1
       AND requester_id = $2
       AND status = 'rejected'
     RETURNING id`,
    [requestId, requesterId],
  );

  return result.rows[0] || null;
};

module.exports = {
  acceptJoinRequest,
  addGroupMessage,
  clearRejectedJoinRequest,
  createGroup,
  createJoinRequest,
  getGroupById,
  getGroupMembers,
  getGroupMessages,
  isGroupMember,
  listGroups,
  listGroupsForUser,
  listJoinRequestsForUser,
  listPendingJoinRequestsForGroup,
  rejectJoinRequest,
};
