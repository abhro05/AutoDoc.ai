// middleware/logger.js

/**
 * Centralized request logging middleware
 * Logs method, URL, status code, response time, and timestamp
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Capture original send method
  const originalSend = res.send;

  res.send = function(data) {
    const responseTime = Date.now() - start;
    const timestamp = new Date().toISOString();
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // Log format: [TIMESTAMP] METHOD URL - STATUS - RESPONSE_TIME ms - IP
    console.log(
      `[${timestamp}] ${method} ${url} - ${statusCode} - ${responseTime}ms - ${ip}`
    );

    // Call original send
    originalSend.call(this, data);
  };

  next();
};

export default requestLogger;