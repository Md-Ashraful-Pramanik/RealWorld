const express = require('express');
const userRoutes = require('./userRoutes');
const profileRoutes = require('./profileRoutes');

const router = express.Router();

router.use(userRoutes);
router.use(profileRoutes);

module.exports = router;