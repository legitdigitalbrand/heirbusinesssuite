export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;

    const emoji = status >= 400 ? '❌' : status >= 300 ? '↪️' : '✅';
    console.log(`${emoji} [${method}] ${path} - ${status} (${duration}ms)`);
  });

  next();
};
