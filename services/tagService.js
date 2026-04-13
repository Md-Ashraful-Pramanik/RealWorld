const tagModel = require('../models/tagModel');

const getTags = async () => {
  const tags = await tagModel.findAllTags();

  return {
    tags,
    statusCode: 200,
  };
};

module.exports = {
  getTags,
};
