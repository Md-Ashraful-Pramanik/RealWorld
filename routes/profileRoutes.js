const express = require('express');
const { follow, getProfile, unfollow } = require('../controllers/profileController');
const { optionalAuth, requireAuth } = require('../utils/auth');

const router = express.Router();

router.get('/profiles/:username', optionalAuth, getProfile);
router.post('/profiles/:username/follow', requireAuth, follow);
router.delete('/profiles/:username/follow', requireAuth, unfollow);

module.exports = router;