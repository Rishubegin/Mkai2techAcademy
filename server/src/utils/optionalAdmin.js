const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Best-effort check for "is this request from a logged-in admin" that never
// throws — used to gate a query-param-triggered admin view (e.g. ?all=true)
// on an otherwise-public route, without forcing auth on the public path.
const isRequestFromAdmin = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) return false;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    return user?.role === "admin";
  } catch {
    return false;
  }
};

module.exports = { isRequestFromAdmin };
