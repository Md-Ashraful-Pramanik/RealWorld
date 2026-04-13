const xss = require('xss');

const commentModel = require('../models/commentModel');
const articleModel = require('../models/articleModel');
const userModel = require('../models/userModel');
const followModel = require('../models/followModel');

const formatComment = (comment, author) => ({
  id: comment.id,
  createdAt: comment.created_at,
  updatedAt: comment.updated_at,
  body: comment.body,
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

const addComment = async (slug, commentData, currentUserId) => {
  const errors = {};

  if (!commentData?.body) {
    errors.body = ['is required'];
  }

  if (Object.keys(errors).length) {
    return { errors, statusCode: 422 };
  }

  const article = await articleModel.findArticleBySlug(slug);

  if (!article) {
    return { errors: { article: ['not found'] }, statusCode: 404 };
  }

  const sanitizedBody = xss(commentData.body);

  const comment = await commentModel.createComment({
    body: sanitizedBody,
    authorId: currentUserId,
    articleId: article.id,
  });

  const author = await resolveAuthorProfile(currentUserId, currentUserId);

  return {
    comment: formatComment(comment, author),
    statusCode: 200,
  };
};

const getComments = async (slug, currentUserId) => {
  const article = await articleModel.findArticleBySlug(slug);

  if (!article) {
    return { errors: { article: ['not found'] }, statusCode: 404 };
  }

  const comments = await commentModel.findCommentsByArticleId(article.id);

  const formattedComments = await Promise.all(
    comments.map(async (comment) => {
      const author = await resolveAuthorProfile(comment.author_id, currentUserId);

      return formatComment(comment, author);
    }),
  );

  return {
    comments: formattedComments,
    statusCode: 200,
  };
};

const deleteComment = async (slug, commentId, currentUserId) => {
  const article = await articleModel.findArticleBySlug(slug);

  if (!article) {
    return { errors: { article: ['not found'] }, statusCode: 404 };
  }

  const comment = await commentModel.findCommentById(commentId);

  if (!comment) {
    return { errors: { comment: ['not found'] }, statusCode: 404 };
  }

  if (comment.article_id !== article.id) {
    return { errors: { comment: ['not found'] }, statusCode: 404 };
  }

  if (comment.author_id !== currentUserId) {
    return { errors: { comment: ['not authorized'] }, statusCode: 403 };
  }

  await commentModel.softDeleteComment(commentId);

  return { statusCode: 200 };
};

module.exports = {
  addComment,
  getComments,
  deleteComment,
};
