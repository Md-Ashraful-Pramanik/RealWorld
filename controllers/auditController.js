const auditService = require('../services/auditService');
const { sendServerError } = require('../utils/response');

const getAudits = async (req, res) => {
  try {
    const result = await auditService.getAuditsByUser(req.user.id);

    return res.status(result.statusCode).json({ audits: result.audits });
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = {
  getAudits,
};
