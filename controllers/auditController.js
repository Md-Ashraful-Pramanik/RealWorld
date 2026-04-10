const { findAuditsByUserId } = require('../models/auditModel');
const { findUserById } = require('../models/userModel');
const { logAudit } = require('../services/auditService');
const { toAuditResponse } = require('../utils/formatters');

async function getAudits(req, res, next) {
  try {
    const authenticatedUser = await findUserById(req.auth.userId);
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    await logAudit(req, {
      userId: authenticatedUser.id,
      action: 'AUDITS_VIEWED',
      statusCode: 200,
      details: {
        username: authenticatedUser.username,
      },
    });

    const audits = await findAuditsByUserId(authenticatedUser.id);

    return res.json({ audits: audits.map(toAuditResponse) });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAudits,
};