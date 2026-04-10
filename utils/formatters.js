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

function toAuditResponse(audit) {
  return {
    id: audit.id,
    username: audit.username,
    action: audit.action,
    method: audit.method,
    path: audit.path,
    statusCode: audit.status_code,
    metadata: audit.metadata,
    createdAt: audit.created_at,
  };
}

module.exports = {
  toUserResponse,
  toProfileResponse,
  toAuditResponse,
};