const userService = require('../services/userService');
const { sendError } = require('../utils/response');

const extractToken = (authorizationHeader = '') => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (!scheme || !token) {
    return null;
  }

  if (scheme !== 'Token' && scheme !== 'Bearer') {
    return null;
  }

  return token;
};

const authenticateUser = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return sendError(res, 401, 'authentication required', {
        authorization: ['token is required'],
      });
    }

    const decoded = userService.verifyToken(token);
    req.user = { id: decoded.id };

    return next();
  } catch (error) {
    return sendError(res, 401, 'authentication required', {
      authorization: ['token is invalid'],
    });
  }
};

const authenticateOptional = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (token) {
      const decoded = userService.verifyToken(token);
      req.user = { id: decoded.id };
    }

    return next();
  } catch (error) {
    return next();
  }
};

module.exports = {
  authenticateUser,
  authenticateOptional,
};