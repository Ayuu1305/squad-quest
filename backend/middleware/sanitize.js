// ✅ XSS Sanitization Middleware
// Removes HTML tags and potentially malicious scripts from all string inputs

/**
 * Simple sanitization function to prevent XSS attacks
 * Removes HTML tags and encodes special characters
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;

  return str
    .replace(/</g, "&lt;") // < to &lt;
    .replace(/>/g, "&gt;") // > to &gt;
    .replace(/"/g, "&quot;") // " to &quot;
    .replace(/'/g, "&#x27;") // ' to &#x27;
    .replace(/\//g, "&#x2F;") // / to &#x2F;
    .trim(); // Remove leading/trailing whitespace
};

/**
 * Recursively sanitize all strings in an object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "string"
        ? sanitizeString(item)
        : typeof item === "object"
          ? sanitizeObject(item)
          : item,
    );
  }

  // Handle objects
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (typeof value === "string") {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
};

/**
 * Middleware: Sanitize all string inputs in req.body
 * Apply this AFTER body parsing but BEFORE route handlers
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  // Also sanitize query params (for GET requests)
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Request size limiter middleware
 * Prevents memory exhaustion attacks via huge payloads
 */
export const requestSizeLimiter = (maxSizeKB = 100) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get("Content-Length") || "0");
    const maxBytes = maxSizeKB * 1024;

    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: `Request too large. Maximum size is ${maxSizeKB}KB.`,
      });
    }

    next();
  };
};
