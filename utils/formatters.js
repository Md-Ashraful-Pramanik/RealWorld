function toUserResponse(user, token) {
  return {
    user: {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  };
}

function toProfileResponse(user, following) {
  return {
    profile: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: Boolean(following),
    },
  };
}

module.exports = {
  toUserResponse,
  toProfileResponse,
};