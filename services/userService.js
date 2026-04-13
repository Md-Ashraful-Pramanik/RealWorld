const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const formatUser = (user) => ({
  email: user.email,
  token: jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }),
  username: user.username,
  bio: user.bio,
  image: user.image,
});

const validateRegistrationPayload = (user) => {
  const errors = {};

  if (!user?.email) {
    errors.email = ['is required'];
  }

  if (!user?.username) {
    errors.username = ['is required'];
  }

  if (!user?.password) {
    errors.password = ['is required'];
  }

  return errors;
};

const validateLoginPayload = (user) => {
  const errors = {};

  if (!user?.email) {
    errors.email = ['is required'];
  }

  if (!user?.password) {
    errors.password = ['is required'];
  }

  return errors;
};

const registerUser = async (user) => {
  const errors = validateRegistrationPayload(user);

  if (Object.keys(errors).length) {
    return { errors, statusCode: 422 };
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const username = user.username.trim();
  const passwordHash = await bcrypt.hash(user.password, 10);

  try {
    const createdUser = await userModel.createUser({
      username,
      email: normalizedEmail,
      passwordHash,
    });

    return { user: formatUser(createdUser), statusCode: 201 };
  } catch (error) {
    if (error.code === '23505') {
      const conflictField = error.constraint?.includes('email') ? 'email' : 'username';
      return {
        errors: { [conflictField]: ['has already been taken'] },
        statusCode: 409,
      };
    }

    throw error;
  }
};

const loginUser = async (user) => {
  const errors = validateLoginPayload(user);

  if (Object.keys(errors).length) {
    return { errors, statusCode: 422 };
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const existingUser = await userModel.findUserByEmail(normalizedEmail);

  if (!existingUser) {
    return {
      errors: { 'email or password': ['is invalid'] },
      statusCode: 401,
    };
  }

  const isPasswordValid = await bcrypt.compare(user.password, existingUser.password_hash);

  if (!isPasswordValid) {
    return {
      errors: { 'email or password': ['is invalid'] },
      statusCode: 401,
    };
  }

  return {
    user: formatUser(existingUser),
    statusCode: 200,
  };
};

const getCurrentUser = async (userId) => {
  const user = await userModel.findUserById(userId);

  if (!user) {
    return {
      errors: { user: ['not found'] },
      statusCode: 404,
    };
  }

  return {
    user: formatUser(user),
    statusCode: 200,
  };
};

const ALLOWED_UPDATE_FIELDS = ['password', 'image', 'bio'];

const updateCurrentUser = async (userId, payload) => {
  const disallowedFields = Object.keys(payload).filter(
    (field) => !ALLOWED_UPDATE_FIELDS.includes(field)
  );

  if (disallowedFields.length) {
    return {
      errors: { [disallowedFields[0]]: ['is not allowed'] },
      statusCode: 422,
    };
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'password')) {
    if (!payload.password) {
      return {
        errors: { password: ['cannot be empty'] },
        statusCode: 422,
      };
    }

    updates.passwordHash = await bcrypt.hash(payload.password, 10);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'bio')) {
    updates.bio = payload.bio;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'image')) {
    updates.image = payload.image;
  }

  const user = await userModel.updateUserById(userId, updates);

  if (!user) {
    return {
      errors: { user: ['not found'] },
      statusCode: 404,
    };
  }

  return {
    user: formatUser(user),
    statusCode: 200,
  };
};

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = {
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
  verifyToken,
};