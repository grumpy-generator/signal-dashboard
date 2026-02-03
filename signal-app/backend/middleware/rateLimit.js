const requests = new Map();

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 min
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX) || 100;

  if (!requests.has(ip)) {
    requests.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const record = requests.get(ip);

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count++;
  next();
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requests.entries()) {
    if (now > record.resetTime) {
      requests.delete(ip);
    }
  }
}, 300000);
