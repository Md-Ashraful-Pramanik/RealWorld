async function initializeDb(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      username VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      bio TEXT,
      image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (follower_id, following_id),
      CHECK (follower_id <> following_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(100) NOT NULL,
      method VARCHAR(10) NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audits_user_id_created_at ON audits(user_id, created_at DESC);
  `);
}

module.exports = { initializeDb };