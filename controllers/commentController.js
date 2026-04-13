const commentService = require('../services/commentService');
const { sendError, sendServerError } = require('../utils/response');

const addComment = async (req, res) => {
  try {
    const result = await commentService.addComment(
      req.params.slug,
      req.body.comment,
      req.user.id,
    );

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ comment: result.comment });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const getComments = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const result = await commentService.getComments(req.params.slug, currentUserId);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ comments: result.comments });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const deleteComment = async (req, res) => {
  try {
    const result = await commentService.deleteComment(
      req.params.slug,
      parseInt(req.params.id, 10),
      req.user.id,
    );

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({});
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment,
};
