const handleErrorResponse = (res, errorMessage, errorDetails) => {
  console.error(errorDetails);
  return res.status(500).json({
    success: false,
    message: errorMessage,
    error: errorDetails.message,
  });
};

module.exports = { handleErrorResponse };
