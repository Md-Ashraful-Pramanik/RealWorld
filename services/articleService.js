const slugify = require('slugify');

const articleModel = require('../models/articleModel');
const userModel = require('../models/userModel');
const followModel = require('../models/followModel');

const generateSlug = (title) => {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = ((Date.now().toString(36)) + Math.random().toString(36).slice(2, 6));

  return `${base}-${suffix}`;
};

const formatArticle = (article, author, favorited) => ({
  slug: article.slug,
  title: article.title,
  description: article.description,
  body: article.body,
  tagList: article.tag_list || [],
  createdAt: article.created_at,
  updatedAt: article.updated_at,
  favorited,
  favoritesCount: article.favorites_count || 0,
  author: {
    username: author.username,
    bio: author.bio || null,
    image: author.image || null,
    following: author.following || false,
  },
});

const resolveAuthorProfile = async (authorId, currentUserId) => {
  const author = await userModel.findUserById(authorId);

  if (!author) return null;

  let following = false;

  if (currentUserId) {
    following = await followModel.isFollowing(currentUserId, authorId);
  }

  return { ...author, following };
};

const createArticle = async (articleData, currentUserId) => {
  const errors = {};

  if (!articleData?.title) errors.title = ['is required'];
  if (!articleData?.description) errors.description = ['is required'];
  if (!articleData?.body) errors.body = ['is required'];

  if (Object.keys(errors).length) {
    return { errors, statusCode: 422 };
  }

  const slug = generateSlug(articleData.title);

  const article = await articleModel.createArticle({
    slug,
    title: articleData.title,
    description: articleData.description,
    body: articleData.body,
    authorId: currentUserId,
    tagList: articleData.tagList || [],
  });

  const author = await resolveAuthorProfile(currentUserId, currentUserId);

  return {
    article: formatArticle(article, author, false),
    statusCode: 201,
  };
};

const getArticle = async (slug, currentUserId) => {
  const article = await articleModel.findArticleBySlug(slug);

  if (!article) {
    return { errors: { article: ['not found'] }, statusCode: 404 };
  }

  const author = await resolveAuthorProfile(article.author_id, currentUserId);
  let favorited = false;

  if (currentUserId) {
    favorited = await articleModel.isArticleFavoritedByUser(article.id, currentUserId);
  }

  return {
    article: formatArticle(article, author, favorited),
    statusCode: 200,
  };
};

const updateArticle = async (slug, updates, currentUserId) => {
  const existingArticle = await articleModel.findArticleBySlug(slug);

  if (!existingArticle) {
    return { errors: { article: ['not found'] }, statusCode: 404 };
  }

  if (existingArticle.author_id !== currentUserId) {
    return { errors: { article: ['not authorized'] }, statusCode: 403 };
  }

  const fieldsToUpdate = {};

  if (updates.title !== undefined) {
    fieldsToUpdate.title = updates.title;
    const newSlug = generateSlug(updates.title);
    fieldsToUpdate.slug = newSlug;
  }

  if (updates.description !== undefined) {
    fieldsToUpdate.description = updates.description;
  }

  if (updates.body !== undefined) {
    fieldsToUpdate.body = updates.body;
  }

  const updatedArticle = await articleModel.updateArticle(existingArticle.id, fieldsToUpdate);

  if (!updatedArticle) {
    return { errors: { article: ['not found'] }, statusCode: 404 };
  }

  const author = await resolveAuthorProfile(updatedArticle.author_id, currentUserId);
  let favorited = false;

  if (currentUserId) {
    favorited = await articleModel.isArticleFavoritedByUser(updatedArticle.id, currentUserId);
  }

  return {
    article: formatArticle(updatedArticle, author, favorited),
    statusCode: 200,
  };
};

const deleteArticle = async (slug, currentUserId) => {
  const existingArticle = await articleModel.findArticleBySlug(slug);

  if (!existingArticle) {
    return { errors: { article: ['not found'] }, statusCode: 404 };
  }

  if (existingArticle.author_id !== currentUserId) {
    return { errors: { article: ['not authorized'] }, statusCode: 403 };
  }

  await articleModel.softDeleteArticle(existingArticle.id);

  return { statusCode: 204 };
};

const listArticles = async (query, currentUserId) => {
  const { tag, author, favorited, limit = 20, offset = 0 } = query;

  const result = await articleModel.listArticles({
    tag,
    author,
    favorited,
    limit: Math.min(parseInt(limit, 10) || 20, 100),
    offset: parseInt(offset, 10) || 0,
  });

  const articles = await Promise.all(
    result.articles.map(async (article) => {
      const author = await resolveAuthorProfile(article.author_id, currentUserId);
      let favorited = false;

      if (currentUserId) {
        favorited = await articleModel.isArticleFavoritedByUser(article.id, currentUserId);
      }

      return formatArticle(article, author, favorited);
    }),
  );

  return {
    articles,
    articlesCount: result.articlesCount,
    statusCode: 200,
  };
};

const feedArticles = async (query, currentUserId) => {
  const { limit = 20, offset = 0 } = query;

  const result = await articleModel.listFeedArticles({
    userId: currentUserId,
    limit: Math.min(parseInt(limit, 10) || 20, 100),
    offset: parseInt(offset, 10) || 0,
  });

  const articles = await Promise.all(
    result.articles.map(async (article) => {
      const author = await resolveAuthorProfile(article.author_id, currentUserId);
      let favorited = false;

      if (currentUserId) {
        favorited = await articleModel.isArticleFavoritedByUser(article.id, currentUserId);
      }

      return formatArticle(article, author, favorited);
    }),
  );

  return {
    articles,
    articlesCount: result.articlesCount,
    statusCode: 200,
  };
};

module.exports = {
  createArticle,
  getArticle,
  updateArticle,
  deleteArticle,
  listArticles,
  feedArticles,
};
