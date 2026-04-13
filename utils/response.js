const sendNotFound = (res) => {
  res.status(404).json({ message: 'not found' });
};

const sendServerError = (res, error) => {
  res.status(500).json({
    message: 'internal server error',
    error: error.message,
  });
};

module.exports = {
  sendNotFound,
  sendServerError,
};
