const auditModel = require('../models/auditModel');

const logAudit = async ({ userId, action, path, statusCode }) => {
  try {
    await auditModel.createAudit({ userId, action, path, statusCode });
  } catch (error) {
    console.error('Failed to log audit:', error.message);
  }
};

const getAuditsByUser = async (userId) => {
  const audits = await auditModel.findAuditsByUserId(userId);

  return {
    audits: audits.map((audit) => ({
      id: audit.id,
      userId: audit.user_id,
      action: audit.action,
      path: audit.path,
      statusCode: audit.status_code,
      createdAt: audit.created_at,
    })),
    statusCode: 200,
  };
};

module.exports = {
  logAudit,
  getAuditsByUser,
};
