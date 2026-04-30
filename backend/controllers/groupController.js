const {
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
} = require('../models/groupModel');

const getAllGroups = async (req, res, next) => {
  try {
    const groups = await listGroups(req.session?.user?.id || null);
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

const getMyJoinRequests = async (req, res, next) => {
  try {
    const requests = await listJoinRequestsForUser(req.session.user.id);
    return res.json({ requests });
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

const getGroupJoinRequests = async (req, res, next) => {
  try {
    const requests = await listPendingJoinRequestsForGroup(req.params.groupId, req.session.user.id);
    return res.json({ requests });
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
    const request = await createJoinRequest(req.params.groupId, req.session.user.id);
    return res.status(201).json({
      request,
      message: 'Join request sent successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

const approveExistingJoinRequest = async (req, res, next) => {
  try {
    const request = await acceptJoinRequest(req.params.requestId, req.session.user.id);
    return res.json({
      request,
      message: 'Join request accepted successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

const rejectExistingJoinRequest = async (req, res, next) => {
  try {
    const request = await rejectJoinRequest(req.params.requestId, req.session.user.id);
    return res.json({
      request,
      message: 'Join request rejected successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

const clearMyRejectedJoinRequest = async (req, res, next) => {
  try {
    const request = await clearRejectedJoinRequest(req.params.requestId, req.session.user.id);
    if (!request) {
      return res.status(404).json({ message: 'Rejected join request not found.' });
    }

    return res.status(204).send();
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
  approveExistingJoinRequest,
  clearMyRejectedJoinRequest,
  createMyGroup,
  getAllGroups,
  getGroupDetails,
  getGroupJoinRequests,
  getMyGroups,
  getMyJoinRequests,
  joinExistingGroup,
  postGroupMessage,
  rejectExistingJoinRequest,
};
