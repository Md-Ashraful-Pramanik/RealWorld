const pool = require('../config/db');

async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findUserByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function createUser({ email, username, passwordHash }) {
  const { rows } = await pool.query(
    `
      INSERT INTO users (email, username, password_hash)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [email, username, passwordHash]
  );

  return rows[0];
}

async function updateUserById(id, updates) {
  const fields = [];
  const values = [];

  if (updates.email !== undefined) {
    fields.push(`email = $${fields.length + 1}`);
    values.push(updates.email);
  }

  if (updates.username !== undefined) {
    fields.push(`username = $${fields.length + 1}`);
    values.push(updates.username);
  }

  if (updates.passwordHash !== undefined) {
    fields.push(`password_hash = $${fields.length + 1}`);
    values.push(updates.passwordHash);
  }

  if (updates.image !== undefined) {
    fields.push(`image = $${fields.length + 1}`);
    values.push(updates.image);
  }

  if (updates.bio !== undefined) {
    fields.push(`bio = $${fields.length + 1}`);
    values.push(updates.bio);
  }

  if (fields.length === 0) {
    return findUserById(id);
  }

  values.push(id);

  const { rows } = await pool.query(
    `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `,
    values
  );

  return rows[0] || null;
}

module.exports = {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  updateUserById,
};