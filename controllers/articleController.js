const articleService = require('../services/articleService');
const { sendError, sendServerError } = require('../utils/response');

const listArticles = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const result = await articleService.listArticles(req.query, currentUserId);

    return res.status(result.statusCode).json({
      articles: result.articles,
      articlesCount: result.articlesCount,
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const feedArticles = async (req, res) => {
  try {
    const result = await articleService.feedArticles(req.query, req.user.id);

    return res.status(result.statusCode).json({
      articles: result.articles,
      articlesCount: result.articlesCount,
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const getArticle = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const result = await articleService.getArticle(req.params.slug, currentUserId);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ article: result.article });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const createArticle = async (req, res) => {
  try {
    const result = await articleService.createArticle(req.body.article, req.user.id);

    if (result.errors) {
      return sendError(res, result.statusCode, 'validation failed', result.errors);
    }

    return res.status(result.statusCode).json({ article: result.article });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const updateArticle = async (req, res) => {
  try {
    if (!req.body.article || typeof req.body.article !== 'object' || Array.isArray(req.body.article)) {
      return sendError(res, 422, 'validation failed', { article: ['is required and must be an object'] });
    }

    const result = await articleService.updateArticle(req.params.slug, req.body.article, req.user.id);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ article: result.article });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const deleteArticle = async (req, res) => {
  try {
    const result = await articleService.deleteArticle(req.params.slug, req.user.id);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({});
  } catch (error) {
    return sendServerError(res, error);
  }
};

const favoriteArticle = async (req, res) => {
  try {
    const result = await articleService.favoriteArticle(req.params.slug, req.user.id);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ article: result.article });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const unfavoriteArticle = async (req, res) => {
  try {
    const result = await articleService.unfavoriteArticle(req.params.slug, req.user.id);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ article: result.article });
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = {
  listArticles,
  feedArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
};
