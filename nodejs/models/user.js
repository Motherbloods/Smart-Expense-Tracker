const mongoose = require("mongoose");

const userExpenseTrackerSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true }, // id dari Telegram
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    photoUrl: { type: String },
    authDate: { type: Date },
  },
  { timestamps: true }
);

const UserExpenseTracker = mongoose.model(
  "UserExpenseTracker",
  userExpenseTrackerSchema
);

module.exports = UserExpenseTracker;
