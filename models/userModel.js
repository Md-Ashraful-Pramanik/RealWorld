const pool = require('../config/db');

let usersTablePromise;

const ensureUsersTable = async () => {
  if (!usersTablePromise) {
    usersTablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          bio TEXT,
          image TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .catch((error) => {
        usersTablePromise = null;
        throw error;
      });
  }

  await usersTablePromise;
};

const createUser = async ({ username, email, passwordHash }) => {
  await ensureUsersTable();

  const query = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, bio, image
  `;
  const values = [username, email, passwordHash];
  const { rows } = await pool.query(query, values);

  return rows[0];
};

const findUserByEmail = async (email) => {
  await ensureUsersTable();

  const query = `
    SELECT id, username, email, password_hash, bio, image
    FROM users
    WHERE email = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [email]);

  return rows[0] || null;
};

const findUserById = async (id) => {
  await ensureUsersTable();

  const query = `
    SELECT id, username, email, bio, image
    FROM users
    WHERE id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
};

const updateUserById = async (id, updates) => {
  await ensureUsersTable();

  const assignments = [];
  const values = [];

  if (updates.passwordHash) {
    values.push(updates.passwordHash);
    assignments.push(`password_hash = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'bio')) {
    values.push(updates.bio);
    assignments.push(`bio = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'image')) {
    values.push(updates.image);
    assignments.push(`image = $${values.length}`);
  }

  if (!assignments.length) {
    return findUserById(id);
  }

  values.push(id);

  const query = `
    UPDATE users
    SET ${assignments.join(', ')}, updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING id, username, email, bio, image
  `;
  const { rows } = await pool.query(query, values);

  return rows[0] || null;
};

module.exports = {
  createUser,
  ensureUsersTable,
  findUserByEmail,
  findUserById,
  updateUserById,
};