const { findUserByUsername } = require('../models/userModel');
const { followUser, isFollowing, unfollowUser } = require('../models/followModel');
const { toProfileResponse } = require('../utils/formatters');
const { recordAudit } = require('../utils/audit');

function getRequestMeta(req) {
  return {
    requestIp: req.ip,
    userAgent: req.headers['user-agent'] || null,
  };
}

async function getProfile(req, res, next) {
  try {
    const targetUser = await findUserByUsername(req.params.username);
    if (!targetUser) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const currentUserId = req.auth?.userId || null;
    const following = await isFollowing(currentUserId, targetUser.id);

    await recordAudit({
      actorUserId: currentUserId,
      action: 'PROFILE_FETCHED',
      entityType: 'profile',
      entityId: String(targetUser.id),
      metadata: { username: targetUser.username },
      ...getRequestMeta(req),
    });

    return res.json(toProfileResponse(targetUser, following));
  } catch (error) {
    return next(error);
  }
}

async function follow(req, res, next) {
  try {
    const targetUser = await findUserByUsername(req.params.username);
    if (!targetUser) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (targetUser.id === req.auth.userId) {
      return res.status(422).json({ errors: { body: ['cannot follow yourself'] } });
    }

    await followUser(req.auth.userId, targetUser.id);
    const following = await isFollowing(req.auth.userId, targetUser.id);

    await recordAudit({
      actorUserId: req.auth.userId,
      action: 'PROFILE_FOLLOWED',
      entityType: 'profile',
      entityId: String(targetUser.id),
      metadata: { username: targetUser.username },
      ...getRequestMeta(req),
    });

    return res.json(toProfileResponse(targetUser, following));
  } catch (error) {
    return next(error);
  }
}

async function unfollow(req, res, next) {
  try {
    const targetUser = await findUserByUsername(req.params.username);
    if (!targetUser) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (targetUser.id === req.auth.userId) {
      return res.status(422).json({ errors: { body: ['cannot unfollow yourself'] } });
    }

    await unfollowUser(req.auth.userId, targetUser.id);

    await recordAudit({
      actorUserId: req.auth.userId,
      action: 'PROFILE_UNFOLLOWED',
      entityType: 'profile',
      entityId: String(targetUser.id),
      metadata: { username: targetUser.username },
      ...getRequestMeta(req),
    });

    return res.json(toProfileResponse(targetUser, false));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProfile,
  follow,
  unfollow,
};