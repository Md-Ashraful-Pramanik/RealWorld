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
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(255),
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      request_ip TEXT,
      user_agent TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at ON audit_logs(action, created_at DESC);
  `);
}

module.exports = { initializeDb };