const express = require('express');

const { authenticateUser, authenticateOptional } = require('../middleware/auth');
const { sayHello } = require('../controllers/helloController');
const { getTestTableData } = require('../controllers/testDbController');
const {
	loginUser,
	registerUser,
	getCurrentUser,
	updateCurrentUser,
} = require('../controllers/userController');
const {
	getProfile,
	followUser,
	unfollowUser,
} = require('../controllers/profileController');

const router = express.Router();

router.get('/hello', sayHello);
router.get('/test-db', getTestTableData);

router.post('/api/users/login', loginUser);
router.post('/api/users', registerUser);
router.get('/api/user', authenticateUser, getCurrentUser);
router.put('/api/user', authenticateUser, updateCurrentUser);

router.get('/api/profiles/:username', authenticateOptional, getProfile);
router.post('/api/profiles/:username/follow', authenticateUser, followUser);
router.delete('/api/profiles/:username/follow', authenticateUser, unfollowUser);

module.exports = router;
