const logger = (req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);

    const responseTime = (
      diff[0] * 1000 +
      diff[1] / 1e6
    ).toFixed(2);

    const timestamp = new Date().toISOString();

    const ip =
      req.ip ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      "Unknown IP";

    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Time: ${responseTime} ms | IP: ${ip}`
    );
  });

  next();
};

export default logger;