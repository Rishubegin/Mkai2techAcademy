// Strips keys starting with "$" or containing "." from req.body to block
// NoSQL operator injection (e.g. { "email": { "$ne": null } }).
// Only sanitizes req.body: in Express 5, req.query/req.params are read-only
// getters, so packages like express-mongo-sanitize that reassign them break.
const stripOperators = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripOperators);
  }

  if (value && typeof value === "object") {
    const cleaned = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      cleaned[key] = stripOperators(val);
    }
    return cleaned;
  }

  return value;
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = stripOperators(req.body);
  }
  next();
};

module.exports = sanitizeBody;
