const handleErrorResponse = (res, errorMessage, errorDetails) => {
  console.error(errorMessage, errorDetails && errorDetails.message);
  return res.status(500).json({
    success: false,
    message: errorMessage,
  });
};

module.exports = { handleErrorResponse };
