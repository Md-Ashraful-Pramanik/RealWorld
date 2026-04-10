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

    if (req.params.username !== authenticatedUser.username) {
      await logAudit(req, {
        userId: authenticatedUser.id,
        action: 'AUDITS_VIEW_DENIED',
        statusCode: 403,
        details: {
          requestedUsername: req.params.username,
        },
      });

      return res.status(403).json({ error: 'Forbidden' });
    }

    await logAudit(req, {
      userId: authenticatedUser.id,
      action: 'AUDITS_VIEWED',
      statusCode: 200,
      details: {
        requestedUsername: req.params.username,
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