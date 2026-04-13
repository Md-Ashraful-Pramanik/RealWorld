const pool = require('../config/db');
const { ensureUsersTable } = require('./userModel');

let followsTablePromise;

const ensureFollowsTable = async () => {
  await ensureUsersTable();

  if (!followsTablePromise) {
    followsTablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS follows (
          follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          followed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (follower_id, followed_id)
        )
      `)
      .catch((error) => {
        followsTablePromise = null;
        throw error;
      });
  }

  await followsTablePromise;
};

const addFollow = async (followerId, followedId) => {
  await ensureFollowsTable();

  const query = `
    INSERT INTO follows (follower_id, followed_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `;
  await pool.query(query, [followerId, followedId]);
};

const removeFollow = async (followerId, followedId) => {
  await ensureFollowsTable();

  const query = `
    DELETE FROM follows
    WHERE follower_id = $1 AND followed_id = $2
  `;
  await pool.query(query, [followerId, followedId]);
};

const isFollowing = async (followerId, followedId) => {
  await ensureFollowsTable();

  const query = `
    SELECT 1 FROM follows
    WHERE follower_id = $1 AND followed_id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [followerId, followedId]);

  return rows.length > 0;
};

module.exports = {
  ensureFollowsTable,
  addFollow,
  removeFollow,
  isFollowing,
};
