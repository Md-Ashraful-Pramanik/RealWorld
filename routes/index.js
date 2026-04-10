const express = require('express');
const auditRoutes = require('./auditRoutes');
const userRoutes = require('./userRoutes');
const profileRoutes = require('./profileRoutes');

const router = express.Router();

router.use(userRoutes);
router.use(profileRoutes);
router.use(auditRoutes);

module.exports = router;