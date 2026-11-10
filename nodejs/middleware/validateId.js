const { isObjectId } = require("../utils/validators");

const validateIdParam = (req, res, next, id) => {
  if (!isObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  return next();
};

module.exports = validateIdParam;
