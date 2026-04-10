const pool = require('../config/db');

async function createAudit({ userId, action, method, path, statusCode, metadata = {} }) {
  const { rows } = await pool.query(
    `
      INSERT INTO audits (user_id, action, method, path, status_code, metadata)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id, user_id, action, method, path, status_code, metadata, created_at
    `,
    [userId, action, method, path, statusCode, JSON.stringify(metadata)]
  );

  return rows[0];
}

async function findAuditsByUserId(userId) {
  const { rows } = await pool.query(
    `
      SELECT a.id, u.username, a.action, a.method, a.path, a.status_code, a.metadata, a.created_at
      FROM audits a
      INNER JOIN users u ON u.id = a.user_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC, a.id DESC
    `,
    [userId]
  );

  return rows;
}

module.exports = {
  createAudit,
  findAuditsByUserId,
};