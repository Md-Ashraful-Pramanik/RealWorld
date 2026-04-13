const pool = require('../config/db');
const { ensureArticlesTable } = require('./articleModel');
const { ensureUsersTable } = require('./userModel');

let commentsTablePromise;

const ensureCommentsTable = async () => {
  await ensureUsersTable();
  await ensureArticlesTable();

  if (!commentsTablePromise) {
    commentsTablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          body TEXT NOT NULL,
          author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          deleted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .catch((error) => {
        commentsTablePromise = null;
        throw error;
      });
  }

  await commentsTablePromise;
};

const createComment = async ({ body, authorId, articleId }) => {
  await ensureCommentsTable();

  const query = `
    INSERT INTO comments (body, author_id, article_id)
    VALUES ($1, $2, $3)
    RETURNING id, body, author_id, article_id, created_at, updated_at
  `;
  const { rows } = await pool.query(query, [body, authorId, articleId]);

  return rows[0];
};

const findCommentsByArticleId = async (articleId) => {
  await ensureCommentsTable();

  const query = `
    SELECT id, body, author_id, article_id, created_at, updated_at
    FROM comments
    WHERE article_id = $1 AND deleted_at IS NULL
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query, [articleId]);

  return rows;
};

const findCommentById = async (id) => {
  await ensureCommentsTable();

  const query = `
    SELECT id, body, author_id, article_id, created_at, updated_at
    FROM comments
    WHERE id = $1 AND deleted_at IS NULL
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
};

const softDeleteComment = async (id) => {
  await ensureCommentsTable();

  const query = `
    UPDATE comments
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id
  `;
  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
};

module.exports = {
  ensureCommentsTable,
  createComment,
  findCommentsByArticleId,
  findCommentById,
  softDeleteComment,
};
