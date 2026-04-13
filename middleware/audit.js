const auditService = require('../services/auditService');

const auditLogger = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    if (req.user && req.user.id) {
      await auditService.logAudit({
        userId: req.user.id,
        action: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
      });
    }

    return originalJson(body);
  };

  next();
};

module.exports = {
  auditLogger,
};