const { rateLimit } = require("express-rate-limit");

const limiter = (windowMs, limit, message, options = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
    ...options,
  });

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

module.exports = {
  apiLimiter: limiter(MINUTE, 300, "Too many requests. Please slow down."),
  // Only failed logins count, so normal users are not locked out.
  loginLimiter: limiter(15 * MINUTE, 10, "Too many failed login attempts. Try again in 15 minutes.", {
    skipSuccessfulRequests: true,
  }),
  registerLimiter: limiter(HOUR, 10, "Too many sign-up attempts. Try again later."),
  uploadLimiter: limiter(HOUR, 30, "Too many uploads. Try again later."),
};
