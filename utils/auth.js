const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function getTokenFromHeader(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (!token) {
    return null;
  }

  if (scheme !== 'Token' && scheme !== 'Bearer') {
    return null;
  }

  return token;
}

function signUserToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyUserToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function optionalAuth(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) {
    return next();
  }

  try {
    const payload = verifyUserToken(token);
    req.auth = { userId: payload.id };
  } catch (error) {
    req.auth = null;
  }

  return next();
}

function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = verifyUserToken(token);
    req.auth = { userId: payload.id };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  getTokenFromHeader,
  signUserToken,
  optionalAuth,
  requireAuth,
};