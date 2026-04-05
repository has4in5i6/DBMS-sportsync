const express = require('express');
const { login, signup, logout, isLoggedIn } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/isLoggedIn', isLoggedIn);

module.exports = router;
