const express = require('express');
const { getAudits } = require('../controllers/auditController');
const { requireAuth } = require('../utils/auth');

const router = express.Router();

router.get('/audits/:username', requireAuth, getAudits);

module.exports = router;