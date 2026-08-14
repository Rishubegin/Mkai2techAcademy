// Every paginated list endpoint answers with the same `pagination` object, so
// the admin tables can share one pager component regardless of what they list.
const getPaginationParams = (query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));

  return { page, limit, skip: (page - 1) * limit };
};

// An empty collection is still one (empty) page — reporting 0 would leave the
// pager rendering "Page 1 of 0".
const buildPagination = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
});

// User-supplied search text goes into a $regex, where an unescaped "(" or "*"
// is either a crash or an expensive backtracking pattern.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { getPaginationParams, buildPagination, escapeRegex };
