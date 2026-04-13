const tagService = require('../services/tagService');
const { sendServerError } = require('../utils/response');

const getTags = async (req, res) => {
  try {
    const result = await tagService.getTags();

    return res.status(result.statusCode).json({ tags: result.tags });
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = {
  getTags,
};
