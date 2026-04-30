const express = require('express');
const { requireAuth, requireRole } = require('../middleware/accessControl');
const {
  createMyGroup,
  getAllGroups,
  getGroupDetails,
  getMyGroups,
  joinExistingGroup,
  postGroupMessage,
} = require('../controllers/groupController');

const router = express.Router();

router.get('/', getAllGroups);
router.get('/mine', requireAuth, requireRole('player'), getMyGroups);
router.get('/:groupId', getGroupDetails);
router.post('/', requireAuth, requireRole('player'), createMyGroup);
router.post('/:groupId/join', requireAuth, requireRole('player'), joinExistingGroup);
router.post('/:groupId/messages', requireAuth, requireRole('player'), postGroupMessage);

module.exports = router;
