const sendNotFound = (res) => {
  res.status(404).json({ message: 'not found' });
};

const sendError = (res, statusCode, message, errors) => {
  const payload = { message };

  if (errors) {
    payload.errors = errors;
  }

  res.status(statusCode).json(payload);
};

const sendServerError = (res, error) => {
  res.status(500).json({
    message: 'internal server error',
    error: error.message,
  });
};

module.exports = {
  sendError,
  sendNotFound,
  sendServerError,
};
