const express = require('express');
const { requireAuth, requireRole } = require('../middleware/accessControl');
const {
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
} = require('../controllers/groupController');

const router = express.Router();

router.get('/', getAllGroups);
router.get('/mine', requireAuth, requireRole('player'), getMyGroups);
router.get('/requests/mine', requireAuth, requireRole('player'), getMyJoinRequests);
router.patch('/requests/:requestId/accept', requireAuth, requireRole('player'), approveExistingJoinRequest);
router.patch('/requests/:requestId/reject', requireAuth, requireRole('player'), rejectExistingJoinRequest);
router.delete('/requests/:requestId', requireAuth, requireRole('player'), clearMyRejectedJoinRequest);
router.get('/:groupId/requests', requireAuth, requireRole('player'), getGroupJoinRequests);
router.get('/:groupId', getGroupDetails);
router.post('/', requireAuth, requireRole('player'), createMyGroup);
router.post('/:groupId/join', requireAuth, requireRole('player'), joinExistingGroup);
router.post('/:groupId/messages', requireAuth, requireRole('player'), postGroupMessage);

module.exports = router;
