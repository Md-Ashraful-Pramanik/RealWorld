const pool = require('../config/db');

async function recordAudit({
  actorUserId = null,
  action,
  entityType,
  entityId = null,
  metadata = {},
  requestIp = null,
  userAgent = null,
}) {
  try {
    await pool.query(
      `
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata, request_ip, user_agent)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
      `,
      [actorUserId, action, entityType, entityId, JSON.stringify(metadata), requestIp, userAgent]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
}

module.exports = {
  recordAudit,
};