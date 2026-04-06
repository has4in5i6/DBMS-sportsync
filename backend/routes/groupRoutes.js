const express = require('express');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
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
router.get('/mine', auth, requireRole('player'), getMyGroups);
router.get('/:groupId', getGroupDetails);
router.post('/', auth, requireRole('player'), createMyGroup);
router.post('/:groupId/join', auth, requireRole('player'), joinExistingGroup);
router.post('/:groupId/messages', auth, requireRole('player'), postGroupMessage);

module.exports = router;
