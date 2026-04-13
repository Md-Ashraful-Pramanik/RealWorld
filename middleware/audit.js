const auditService = require('../services/auditService');

const auditLogger = (req, res, next) => {
  res.once('finish', async () => {
    if (!req.user || !req.user.id) {
      return;
    }

    const path = req.originalUrl.split('?')[0];
    
    await auditService.logAudit({
      userId: req.user.id,
      action: req.method,
      path,
      statusCode: res.statusCode,
    });
  });

  next();
};

module.exports = {
  auditLogger,
};