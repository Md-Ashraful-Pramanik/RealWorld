const pool = require('../config/db');

const getAllRows = async () => {
  const { rows } = await pool.query('SELECT * FROM test');
  return rows;
};

module.exports = {
  getAllRows,
};
