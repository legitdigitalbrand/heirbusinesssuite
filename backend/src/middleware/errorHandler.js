export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Validation error
  if (err.validation) {
    status = 400;
    message = err.validation;
  }

  // Database error
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Database connection error';
  }

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString(),
  });
};
