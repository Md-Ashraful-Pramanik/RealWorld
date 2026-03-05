const pool = require('../config/db');

async function isFollowing(followerId, followingId) {
  if (!followerId) {
    return false;
  }

  const { rows } = await pool.query(
    'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );

  return rows.length > 0;
}

async function followUser(followerId, followingId) {
  await pool.query(
    `
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
      ON CONFLICT (follower_id, following_id) DO NOTHING
    `,
    [followerId, followingId]
  );
}

async function unfollowUser(followerId, followingId) {
  await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [
    followerId,
    followingId,
  ]);
}

module.exports = {
  isFollowing,
  followUser,
  unfollowUser,
};