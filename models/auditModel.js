const pool = require('../config/db');
const { ensureUsersTable } = require('./userModel');

let auditsTablePromise;

const ensureAuditsTable = async () => {
  await ensureUsersTable();

  if (!auditsTablePromise) {
    auditsTablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS audits (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          action VARCHAR(10) NOT NULL,
          path VARCHAR(512) NOT NULL,
          status_code INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .catch((error) => {
        auditsTablePromise = null;
        throw error;
      });
  }

  await auditsTablePromise;
};

const createAudit = async ({ userId, action, path, statusCode }) => {
  await ensureAuditsTable();

  const query = `
    INSERT INTO audits (user_id, action, path, status_code)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, action, path, status_code, created_at
  `;
  const values = [userId, action, path, statusCode];
  const { rows } = await pool.query(query, values);

  return rows[0];
};

const findAuditsByUserId = async (userId) => {
  await ensureAuditsTable();

  const query = `
    SELECT id, user_id, action, path, status_code, created_at
    FROM audits
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query, [userId]);

  return rows;
};

module.exports = {
  ensureAuditsTable,
  createAudit,
  findAuditsByUserId,
};
