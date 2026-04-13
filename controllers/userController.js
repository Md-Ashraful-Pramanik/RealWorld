const userService = require('../services/userService');
const { sendError, sendServerError } = require('../utils/response');

const loginUser = async (req, res) => {
  try {
    const result = await userService.loginUser(req.body.user);

    if (result.errors) {
      return sendError(res, result.statusCode, 'validation failed', result.errors);
    }

    const decoded = userService.verifyToken(result.user.token);
    req.user = { id: decoded.id };

    return res.status(result.statusCode).json({ user: result.user });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const registerUser = async (req, res) => {
  try {
    const result = await userService.registerUser(req.body.user);

    if (result.errors) {
      return sendError(res, result.statusCode, 'validation failed', result.errors);
    }

    const decoded = userService.verifyToken(result.user.token);
    req.user = { id: decoded.id };

    return res.status(result.statusCode).json({ user: result.user });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const result = await userService.getCurrentUser(req.user.id);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ user: result.user });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    if (!req.body.user || typeof req.body.user !== 'object' || Array.isArray(req.body.user)) {
      return sendError(res, 422, 'validation failed', { user: ['is required and must be an object'] });
    }

    const result = await userService.updateCurrentUser(req.user.id, req.body.user);

    if (result.errors) {
      return sendError(res, result.statusCode, 'validation failed', result.errors);
    }

    return res.status(result.statusCode).json({ user: result.user });
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = {
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
};