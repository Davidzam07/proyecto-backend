module.exports = (err, _req, res, _next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    status: 'error',
    error: err.message || 'Internal server error',
  });
};

