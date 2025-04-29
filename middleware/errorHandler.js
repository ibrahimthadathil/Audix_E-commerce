// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('Error:', err.stack);

  // Get error status and message
  const status = err.status || 500;
  let message = err.message || 'Something went wrong!';

  // Make error messages more user-friendly
  if (message.includes('Cannot read properties of undefined')) {
    message = 'The requested content is not available at the moment.';
  } else if (message.includes('Cast to ObjectId failed')) {
    message = 'The requested item could not be found.';
  } else if (message.includes('E11000 duplicate key error')) {
    message = 'This item already exists.';
  } else if (message.includes('jwt expired')) {
    message = 'Your session has expired. Please log in again.';
  } else if (message.includes('jwt malformed')) {
    message = 'Invalid authentication. Please log in again.';
  }

  // Store error details in session
  req.session.error = {
    status: status,
    message: message
  };

  // Redirect to error page
  res.redirect('/error');
};

// 404 Not Found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = { errorHandler, notFound };