const mongoose = require("mongoose");

const loginCodeSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginCode", loginCodeSchema);
