const profileService = require('../services/profileService');
const { sendError, sendServerError } = require('../utils/response');

const getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const result = await profileService.getProfile(username, currentUserId);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ profile: result.profile });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const followUser = async (req, res) => {
  try {
    const { username } = req.params;

    const result = await profileService.followUser(username, req.user.id);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ profile: result.profile });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { username } = req.params;

    const result = await profileService.unfollowUser(username, req.user.id);

    if (result.errors) {
      return sendError(res, result.statusCode, 'request failed', result.errors);
    }

    return res.status(result.statusCode).json({ profile: result.profile });
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = {
  getProfile,
  followUser,
  unfollowUser,
};
