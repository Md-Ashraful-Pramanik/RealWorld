const testService = require('../services/testService');
const { sendServerError } = require('../utils/response');

const getTestTableData = async (req, res) => {
  try {
    const data = await testService.fetchTestTableRows();
    res.status(200).json(data);
  } catch (error) {
    sendServerError(res, error);
  }
};

module.exports = {
  getTestTableData,
};
