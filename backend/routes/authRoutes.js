const express = require('express');
const { getSession, login, logout, signup } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/session', getSession);

module.exports = router;
