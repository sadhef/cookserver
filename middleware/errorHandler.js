/**
 * Global error handler middleware
 * Catches all errors from async handlers and sends appropriate responses
 */

const errorHandler = (err, req, res, next) => {
    // Log error for server debugging
    console.error('Error:', err.message);
    console.error(err.stack);
  
    // Check if response has already been sent
    if (res.headersSent) {
      return next(err);
    }
  
    // Get status code from error or default to 500
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
  
    // Send JSON response
    res.status(statusCode).json({
      success: false,
      error: message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  };
  
  module.exports = errorHandler;