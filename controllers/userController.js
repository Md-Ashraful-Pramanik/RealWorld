const bcrypt = require('bcryptjs');
const {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  updateUserById,
} = require('../models/userModel');
const { signUserToken } = require('../utils/auth');
const { toUserResponse } = require('../utils/formatters');
const { recordAudit } = require('../utils/audit');

function getRequestMeta(req) {
  return {
    requestIp: req.ip,
    userAgent: req.headers['user-agent'] || null,
  };
}

function validationError(res, message) {
  return res.status(422).json({ errors: { body: [message] } });
}

async function register(req, res, next) {
  try {
    const userPayload = req.body?.user;
    const email = userPayload?.email?.trim();
    const username = userPayload?.username?.trim();
    const password = userPayload?.password;

    if (!email || !username || !password) {
      return validationError(res, 'email, username, and password are required');
    }

    const existingByEmail = await findUserByEmail(email);
    if (existingByEmail) {
      return validationError(res, 'email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, username, passwordHash });
    const token = signUserToken(user.id);

    await recordAudit({
      actorUserId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: String(user.id),
      metadata: { email: user.email, username: user.username },
      ...getRequestMeta(req),
    });

    return res.status(201).json(toUserResponse(user, token));
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const userPayload = req.body?.user;
    const email = userPayload?.email?.trim();
    const password = userPayload?.password;

    if (!email || !password) {
      return validationError(res, 'email and password are required');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signUserToken(user.id);

    await recordAudit({
      actorUserId: user.id,
      action: 'USER_LOGGED_IN',
      entityType: 'user',
      entityId: String(user.id),
      metadata: { email: user.email },
      ...getRequestMeta(req),
    });

    return res.json(toUserResponse(user, token));
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await findUserById(req.auth.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const token = signUserToken(user.id);

    await recordAudit({
      actorUserId: user.id,
      action: 'USER_FETCHED_CURRENT',
      entityType: 'user',
      entityId: String(user.id),
      metadata: {},
      ...getRequestMeta(req),
    });

    return res.json(toUserResponse(user, token));
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userPayload = req.body?.user;
    if (!userPayload || typeof userPayload !== 'object') {
      return validationError(res, 'user payload is required');
    }
    if(userPayload.email !== undefined){
      return validationError(res, 'email cannot be updated');
    }

    const updates = {};
    
    if (userPayload.username !== undefined) {
      updates.username = String(userPayload.username).trim();
    }
    if (userPayload.image !== undefined) {
      updates.image = userPayload.image;
    }
    if (userPayload.bio !== undefined) {
      updates.bio = userPayload.bio;
    }
    if (userPayload.password !== undefined) {
      updates.passwordHash = await bcrypt.hash(String(userPayload.password), 10);
    }

    if (updates.email) {
      const existing = await findUserByEmail(updates.email);
      if (existing && existing.id !== req.auth.userId) {
        return validationError(res, 'email already exists');
      }
    }

    if (updates.username) {
      const existing = await findUserByUsername(updates.username);
      if (existing && existing.id !== req.auth.userId) {
        return validationError(res, 'username already exists');
      }
    }

    const updatedUser = await updateUserById(req.auth.userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = signUserToken(updatedUser.id);

    await recordAudit({
      actorUserId: updatedUser.id,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: String(updatedUser.id),
      metadata: {
        updatedFields: Object.keys(userPayload).filter((field) =>
          ['email', 'username', 'password', 'image', 'bio'].includes(field)
        ),
      },
      ...getRequestMeta(req),
    });

    return res.json(toUserResponse(updatedUser, token));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateUser,
};