const {
  addGroupMessage,
  createGroup,
  getGroupById,
  getGroupMembers,
  getGroupMessages,
  isGroupMember,
  joinGroup,
  listGroups,
  listGroupsForUser,
} = require('../models/groupModel');

const getAllGroups = async (_req, res, next) => {
  try {
    const groups = await listGroups();
    return res.json({ groups });
  } catch (error) {
    return next(error);
  }
};

const getMyGroups = async (req, res, next) => {
  try {
    const groups = await listGroupsForUser(req.session.user.id);
    return res.json({ groups });
  } catch (error) {
    return next(error);
  }
};

const getGroupDetails = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id || null;
    const group = await getGroupById(req.params.groupId, userId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const members = await getGroupMembers(req.params.groupId);
    const messages = group.is_member ? await getGroupMessages(req.params.groupId) : [];
    return res.json({ group, members, messages });
  } catch (error) {
    return next(error);
  }
};

const createMyGroup = async (req, res, next) => {
  try {
    const group = await createGroup(req.session.user.id, req.body);
    return res.status(201).json({ group });
  } catch (error) {
    return next(error);
  }
};

const joinExistingGroup = async (req, res, next) => {
  try {
    const membership = await joinGroup(req.params.groupId, req.session.user.id);
    return res.json({
      joined: Boolean(membership),
      message: membership ? 'Joined group successfully.' : 'You are already a member of this group.',
    });
  } catch (error) {
    return next(error);
  }
};

const postGroupMessage = async (req, res, next) => {
  try {
    const { messageText } = req.body;
    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }

    const group = await getGroupById(req.params.groupId, req.session.user.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const member = await isGroupMember(req.params.groupId, req.session.user.id);
    if (!member) {
      return res.status(403).json({ message: 'Join the group to participate in the chat.' });
    }

    const message = await addGroupMessage(req.params.groupId, req.session.user.id, messageText);
    return res.status(201).json({ message });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createMyGroup,
  getAllGroups,
  getGroupDetails,
  getMyGroups,
  joinExistingGroup,
  postGroupMessage,
};
