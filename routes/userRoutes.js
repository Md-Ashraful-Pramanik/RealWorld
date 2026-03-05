const express = require('express');
const { getCurrentUser, login, register, updateUser } = require('../controllers/userController');
const { requireAuth } = require('../utils/auth');

const router = express.Router();

router.post('/users/login', login);
router.post('/users', register);
router.get('/user', requireAuth, getCurrentUser);
router.put('/user', requireAuth, updateUser);

module.exports = router;