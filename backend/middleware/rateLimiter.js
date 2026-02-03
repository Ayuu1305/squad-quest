import rateLimit from "express-rate-limit";

// ✅ Global Rate Limiter: Prevent DDoS attacks
// Max 100 requests per 15 minutes per IP address
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: "Too many requests from this IP. Please try again in 15 minutes.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// ✅ Bounty Claim Rate Limiter
// Max 5 attempts per 24 hours (IP-based for simplicity)
export const bountyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 attempts per day
  message: {
    error: "Too many bounty claim attempts. You can only try 5 times per day.",
    retryAfter: "24 hours",
  },
});

// ✅ Vibe Check Rate Limiter
// Max 20 submissions per hour (prevent fake badge inflation)
export const vibeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 vibe checks per hour
  message: {
    error: "Slow down! Max 20 vibe checks per hour.",
    retryAfter: "1 hour",
  },
});

// ✅ Quest Join/Leave Rate Limiter
// Max 30 actions per hour (prevent join/leave spam loops)
export const questActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 joins/leaves per hour
  message: {
    error: "Too many quest actions. Max 30 per hour.",
    retryAfter: "1 hour",
  },
});

// ✅ Chat Message Rate Limiter
// Max 50 messages per 10 minutes (prevent spam)
export const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 messages per 10 min
  message: {
    error: "Message rate limit exceeded. Max 50 messages per 10 minutes.",
    retryAfter: "10 minutes",
  },
});
