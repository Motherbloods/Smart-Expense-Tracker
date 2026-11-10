const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Forbidden",
    code: "FORBIDDEN",
  });
};

module.exports = requireAdmin;
