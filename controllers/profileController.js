const { findUserByUsername } = require('../models/userModel');
const { followUser, isFollowing, unfollowUser } = require('../models/followModel');
const { logAudit } = require('../services/auditService');
const { toProfileResponse } = require('../utils/formatters');

async function getProfile(req, res, next) {
  try {
    const targetUser = await findUserByUsername(req.params.username);
    if (!targetUser) {
      if (req.auth?.userId) {
        await logAudit(req, {
          userId: req.auth.userId,
          action: 'PROFILE_VIEW_REJECTED',
          statusCode: 404,
          details: {
            targetUsername: req.params.username,
            reason: 'profile not found',
          },
        });
      }

      return res.status(404).json({ error: 'Profile not found' });
    }

    const currentUserId = req.auth?.userId || null;
    const following = await isFollowing(currentUserId, targetUser.id);

    if (currentUserId) {
      await logAudit(req, {
        userId: currentUserId,
        action: 'PROFILE_VIEWED',
        statusCode: 200,
        details: {
          targetUsername: targetUser.username,
          following,
        },
      });
    }

    return res.json(toProfileResponse(targetUser, following));
  } catch (error) {
    return next(error);
  }
}

async function follow(req, res, next) {
  try {
    const targetUser = await findUserByUsername(req.params.username);
    if (!targetUser) {
      await logAudit(req, {
        userId: req.auth.userId,
        action: 'PROFILE_FOLLOW_REJECTED',
        statusCode: 404,
        details: {
          targetUsername: req.params.username,
          reason: 'profile not found',
        },
      });

      return res.status(404).json({ error: 'Profile not found' });
    }

    if (targetUser.id === req.auth.userId) {
      await logAudit(req, {
        userId: req.auth.userId,
        action: 'PROFILE_FOLLOW_REJECTED',
        statusCode: 422,
        details: {
          targetUsername: targetUser.username,
          reason: 'cannot follow yourself',
        },
      });

      return res.status(422).json({ errors: { body: ['cannot follow yourself'] } });
    }

    await followUser(req.auth.userId, targetUser.id);
    const following = await isFollowing(req.auth.userId, targetUser.id);

    await logAudit(req, {
      userId: req.auth.userId,
      action: 'PROFILE_FOLLOWED',
      statusCode: 200,
      details: {
        targetUsername: targetUser.username,
      },
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
      await logAudit(req, {
        userId: req.auth.userId,
        action: 'PROFILE_UNFOLLOW_REJECTED',
        statusCode: 404,
        details: {
          targetUsername: req.params.username,
          reason: 'profile not found',
        },
      });

      return res.status(404).json({ error: 'Profile not found' });
    }

    if (targetUser.id === req.auth.userId) {
      await logAudit(req, {
        userId: req.auth.userId,
        action: 'PROFILE_UNFOLLOW_REJECTED',
        statusCode: 422,
        details: {
          targetUsername: targetUser.username,
          reason: 'cannot unfollow yourself',
        },
      });

      return res.status(422).json({ errors: { body: ['cannot unfollow yourself'] } });
    }

    await unfollowUser(req.auth.userId, targetUser.id);

    await logAudit(req, {
      userId: req.auth.userId,
      action: 'PROFILE_UNFOLLOWED',
      statusCode: 200,
      details: {
        targetUsername: targetUser.username,
      },
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