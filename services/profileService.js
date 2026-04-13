const userModel = require('../models/userModel');
const followModel = require('../models/followModel');

const formatProfile = (user, following) => ({
  username: user.username,
  bio: user.bio || null,
  image: user.image || null,
  following,
});

const getProfile = async (username, currentUserId) => {
  const user = await userModel.findUserByUsername(username);

  if (!user) {
    return {
      errors: { profile: ['not found'] },
      statusCode: 404,
    };
  }

  let following = false;

  if (currentUserId) {
    following = await followModel.isFollowing(currentUserId, user.id);
  }

  return {
    profile: formatProfile(user, following),
    statusCode: 200,
  };
};

const followUser = async (username, currentUserId) => {
  const user = await userModel.findUserByUsername(username);

  if (!user) {
    return {
      errors: { profile: ['not found'] },
      statusCode: 404,
    };
  }

  if (user.id === currentUserId) {
    return {
      errors: { profile: ['cannot follow yourself'] },
      statusCode: 422,
    };
  }

  await followModel.addFollow(currentUserId, user.id);

  return {
    profile: formatProfile(user, true),
    statusCode: 200,
  };
};

const unfollowUser = async (username, currentUserId) => {
  const user = await userModel.findUserByUsername(username);

  if (!user) {
    return {
      errors: { profile: ['not found'] },
      statusCode: 404,
    };
  }

  await followModel.removeFollow(currentUserId, user.id);

  return {
    profile: formatProfile(user, false),
    statusCode: 200,
  };
};

module.exports = {
  getProfile,
  followUser,
  unfollowUser,
};
