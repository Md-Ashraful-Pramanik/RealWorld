const pool = require('../config/db');
const { ensureUsersTable } = require('./userModel');

let articlesTablePromise;
let articleTagsTablePromise;
let favoritesTablePromise;

const ensureArticlesTable = async () => {
  await ensureUsersTable();

  if (!articlesTablePromise) {
    articlesTablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS articles (
          id SERIAL PRIMARY KEY,
          slug VARCHAR(512) NOT NULL UNIQUE,
          title VARCHAR(512) NOT NULL,
          description TEXT NOT NULL,
          body TEXT NOT NULL,
          author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          deleted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .catch((error) => {
        articlesTablePromise = null;
        throw error;
      });
  }

  await articlesTablePromise;
};

const ensureArticleTagsTable = async () => {
  await ensureArticlesTable();

  if (!articleTagsTablePromise) {
    articleTagsTablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS article_tags (
          article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          tag VARCHAR(255) NOT NULL,
          position INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (article_id, tag)
        )
      `)
      .catch((error) => {
        articleTagsTablePromise = null;
        throw error;
      });
  }

  await articleTagsTablePromise;
};

const ensureFavoritesTable = async () => {
  await ensureArticlesTable();

  if (!favoritesTablePromise) {
    favoritesTablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS favorites (
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, article_id)
        )
      `)
      .catch((error) => {
        favoritesTablePromise = null;
        throw error;
      });
  }

  await favoritesTablePromise;
};

const ensureAllTables = async () => {
  await ensureArticlesTable();
  await ensureArticleTagsTable();
  await ensureFavoritesTable();
};

const createArticle = async ({ slug, title, description, body, authorId, tagList }) => {
  await ensureAllTables();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const articleQuery = `
      INSERT INTO articles (slug, title, description, body, author_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, slug, title, description, body, author_id, created_at, updated_at
    `;
    const { rows: articleRows } = await client.query(articleQuery, [
      slug,
      title,
      description,
      body,
      authorId,
    ]);
    const article = articleRows[0];

    if (tagList && tagList.length > 0) {
      const tagValues = tagList.map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(', ');
      const tagParams = [article.id];
      tagList.forEach((tag, i) => {
        tagParams.push(tag, i);
      });
      await client.query(
        `INSERT INTO article_tags (article_id, tag, position) VALUES ${tagValues} ON CONFLICT DO NOTHING`,
        tagParams,
      );
    }

    await client.query('COMMIT');

    return { ...article, tag_list: tagList || [] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const findArticleBySlug = async (slug) => {
  await ensureAllTables();

  const query = `
    SELECT a.id, a.slug, a.title, a.description, a.body,
           a.author_id, a.created_at, a.updated_at,
           COALESCE(
             (SELECT array_agg(t.tag ORDER BY t.position) FROM article_tags t WHERE t.article_id = a.id),
             ARRAY[]::VARCHAR[]
           ) AS tag_list,
           (SELECT COUNT(*)::INTEGER FROM favorites f WHERE f.article_id = a.id) AS favorites_count
    FROM articles a
    WHERE a.slug = $1 AND a.deleted_at IS NULL
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [slug]);

  return rows[0] || null;
};

const updateArticle = async (id, updates) => {
  await ensureAllTables();

  const assignments = [];
  const values = [];

  if (updates.slug !== undefined) {
    values.push(updates.slug);
    assignments.push(`slug = $${values.length}`);
  }

  if (updates.title !== undefined) {
    values.push(updates.title);
    assignments.push(`title = $${values.length}`);
  }

  if (updates.description !== undefined) {
    values.push(updates.description);
    assignments.push(`description = $${values.length}`);
  }

  if (updates.body !== undefined) {
    values.push(updates.body);
    assignments.push(`body = $${values.length}`);
  }

  if (!assignments.length) {
    return findArticleById(id);
  }

  values.push(id);

  const query = `
    UPDATE articles
    SET ${assignments.join(', ')}, updated_at = NOW()
    WHERE id = $${values.length} AND deleted_at IS NULL
    RETURNING id, slug, title, description, body, author_id, created_at, updated_at
  `;
  const { rows } = await pool.query(query, values);

  if (!rows[0]) return null;

  const article = rows[0];
  const tagQuery = `
    SELECT COALESCE(array_agg(tag ORDER BY position), ARRAY[]::VARCHAR[]) AS tag_list
    FROM article_tags WHERE article_id = $1
  `;
  const { rows: tagRows } = await pool.query(tagQuery, [article.id]);
  article.tag_list = tagRows[0].tag_list;

  const favQuery = `SELECT COUNT(*)::INTEGER AS favorites_count FROM favorites WHERE article_id = $1`;
  const { rows: favRows } = await pool.query(favQuery, [article.id]);
  article.favorites_count = favRows[0].favorites_count;

  return article;
};

const softDeleteArticle = async (id) => {
  await ensureArticlesTable();

  const query = `
    UPDATE articles
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id
  `;
  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
};

const findArticleById = async (id) => {
  await ensureAllTables();

  const query = `
    SELECT a.id, a.slug, a.title, a.description, a.body,
           a.author_id, a.created_at, a.updated_at,
           COALESCE(
             (SELECT array_agg(t.tag ORDER BY t.position) FROM article_tags t WHERE t.article_id = a.id),
             ARRAY[]::VARCHAR[]
           ) AS tag_list,
           (SELECT COUNT(*)::INTEGER FROM favorites f WHERE f.article_id = a.id) AS favorites_count
    FROM articles a
    WHERE a.id = $1 AND a.deleted_at IS NULL
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
};

const listArticles = async ({ tag, author, favorited, limit = 20, offset = 0 }) => {
  await ensureAllTables();

  const conditions = ['a.deleted_at IS NULL'];
  const params = [];

  if (tag) {
    params.push(tag);
    conditions.push(`EXISTS (SELECT 1 FROM article_tags t WHERE t.article_id = a.id AND t.tag = $${params.length})`);
  }

  if (author) {
    params.push(author);
    conditions.push(`u.username = $${params.length}`);
  }

  if (favorited) {
    params.push(favorited);
    conditions.push(`EXISTS (SELECT 1 FROM favorites fv JOIN users fu ON fu.id = fv.user_id WHERE fv.article_id = a.id AND fu.username = $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countQuery = `
    SELECT COUNT(*)::INTEGER AS total
    FROM articles a
    JOIN users u ON u.id = a.author_id
    ${whereClause}
  `;
  const { rows: countRows } = await pool.query(countQuery, params);
  const articlesCount = countRows[0].total;

  // Data query
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const dataQuery = `
    SELECT a.id, a.slug, a.title, a.description, a.body,
           a.author_id, a.created_at, a.updated_at,
           COALESCE(
             (SELECT array_agg(t.tag ORDER BY t.position) FROM article_tags t WHERE t.article_id = a.id),
             ARRAY[]::VARCHAR[]
           ) AS tag_list,
           (SELECT COUNT(*)::INTEGER FROM favorites f WHERE f.article_id = a.id) AS favorites_count
    FROM articles a
    JOIN users u ON u.id = a.author_id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const { rows } = await pool.query(dataQuery, params);

  return { articles: rows, articlesCount };
};

const listFeedArticles = async ({ userId, limit = 20, offset = 0 }) => {
  await ensureAllTables();

  const countQuery = `
    SELECT COUNT(*)::INTEGER AS total
    FROM articles a
    JOIN follows f ON f.followed_id = a.author_id
    WHERE f.follower_id = $1 AND a.deleted_at IS NULL
  `;
  const { rows: countRows } = await pool.query(countQuery, [userId]);
  const articlesCount = countRows[0].total;

  const dataQuery = `
    SELECT a.id, a.slug, a.title, a.description, a.body,
           a.author_id, a.created_at, a.updated_at,
           COALESCE(
             (SELECT array_agg(t.tag ORDER BY t.position) FROM article_tags t WHERE t.article_id = a.id),
             ARRAY[]::VARCHAR[]
           ) AS tag_list,
           (SELECT COUNT(*)::INTEGER FROM favorites fav WHERE fav.article_id = a.id) AS favorites_count
    FROM articles a
    JOIN follows f ON f.followed_id = a.author_id
    WHERE f.follower_id = $1 AND a.deleted_at IS NULL
    ORDER BY a.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const { rows } = await pool.query(dataQuery, [userId, limit, offset]);

  return { articles: rows, articlesCount };
};

const isArticleFavoritedByUser = async (articleId, userId) => {
  await ensureFavoritesTable();

  const query = `SELECT 1 FROM favorites WHERE article_id = $1 AND user_id = $2 LIMIT 1`;
  const { rows } = await pool.query(query, [articleId, userId]);

  return rows.length > 0;
};

const favoriteArticle = async (userId, articleId) => {
  await ensureFavoritesTable();

  const query = `
    INSERT INTO favorites (user_id, article_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `;
  await pool.query(query, [userId, articleId]);
};

const unfavoriteArticle = async (userId, articleId) => {
  await ensureFavoritesTable();

  const query = `
    DELETE FROM favorites
    WHERE user_id = $1 AND article_id = $2
  `;
  await pool.query(query, [userId, articleId]);
};

const findSlugExists = async (slug, excludeId) => {
  await ensureArticlesTable();

  let query = `SELECT 1 FROM articles WHERE slug = $1 AND deleted_at IS NULL`;
  const params = [slug];

  if (excludeId) {
    query += ` AND id != $2`;
    params.push(excludeId);
  }

  query += ' LIMIT 1';
  const { rows } = await pool.query(query, params);

  return rows.length > 0;
};

module.exports = {
  ensureArticlesTable,
  ensureArticleTagsTable,
  ensureFavoritesTable,
  ensureAllTables,
  createArticle,
  findArticleBySlug,
  findArticleById,
  updateArticle,
  softDeleteArticle,
  listArticles,
  listFeedArticles,
  isArticleFavoritedByUser,
  favoriteArticle,
  unfavoriteArticle,
  findSlugExists,
};
