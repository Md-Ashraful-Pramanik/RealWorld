const testModel = require('../models/testModel');

const fetchTestTableRows = async () => testModel.getAllRows();

module.exports = {
  fetchTestTableRows,
};
