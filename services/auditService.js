const { createAudit } = require('../models/auditModel');

function removeUndefinedValues(value) {
  if (Array.isArray(value)) {
    return value.map(removeUndefinedValues);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, currentValue]) => {
      if (currentValue !== undefined) {
        accumulator[key] = removeUndefinedValues(currentValue);
      }

      return accumulator;
    }, {});
  }

  return value;
}

function buildAuditMetadata(req, details = {}) {
  return removeUndefinedValues({
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
    params: req.params,
    query: req.query,
    details,
  });
}

async function logAudit(req, { userId, action, statusCode, details = {} }) {
  if (!userId) {
    return null;
  }

  return createAudit({
    userId,
    action,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    metadata: buildAuditMetadata(req, details),
  });
}

module.exports = {
  logAudit,
};