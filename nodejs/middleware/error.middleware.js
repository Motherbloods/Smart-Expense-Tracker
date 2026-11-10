const notFound = (req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) {
    console.error("Unhandled error:", err.message);
  }

  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : "Invalid request",
  });
};

module.exports = { notFound, errorHandler };
