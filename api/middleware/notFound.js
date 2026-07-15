// middleware/notFound.js

import { AppError } from './errorHandler.js';

/**
 * 404 Not Found middleware
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

export default notFound;