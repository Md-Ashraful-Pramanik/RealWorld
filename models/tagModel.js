const pool = require('../config/db');

let tagsTablePromise;

const ensureTagsTable = async () => {
  if (!tagsTablePromise) {
    tagsTablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS tags (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .catch((error) => {
        tagsTablePromise = null;
        throw error;
      });
  }

  await tagsTablePromise;
};

const findAllTags = async () => {
  await ensureTagsTable();

  const query = `
    SELECT DISTINCT tag AS name
    FROM article_tags
    ORDER BY tag ASC
  `;
  const { rows } = await pool.query(query);

  return rows.map((row) => row.name);
};

const upsertTag = async (name) => {
  await ensureTagsTable();

  const query = `
    INSERT INTO tags (name)
    VALUES ($1)
    ON CONFLICT (name) DO NOTHING
    RETURNING id, name
  `;
  const { rows } = await pool.query(query, [name]);

  if (rows[0]) return rows[0];

  const selectQuery = `SELECT id, name FROM tags WHERE name = $1`;
  const { rows: selectRows } = await pool.query(selectQuery, [name]);

  return selectRows[0];
};

module.exports = {
  ensureTagsTable,
  findAllTags,
  upsertTag,
};
