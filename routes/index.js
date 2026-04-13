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
const {
	listArticles,
	feedArticles,
	getArticle,
	createArticle,
	updateArticle,
	deleteArticle,
} = require('../controllers/articleController');
const { getAudits } = require('../controllers/auditController');

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

router.get('/api/articles/feed', authenticateUser, feedArticles);
router.get('/api/articles', authenticateOptional, listArticles);
router.get('/api/articles/:slug', authenticateOptional, getArticle);
router.post('/api/articles', authenticateUser, createArticle);
router.put('/api/articles/:slug', authenticateUser, updateArticle);
router.delete('/api/articles/:slug', authenticateUser, deleteArticle);

router.get('/api/audits', authenticateUser, getAudits);

module.exports = router;
