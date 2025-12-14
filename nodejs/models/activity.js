const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    telegramId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["expense", "income"],
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sourceUser: {
      type: String,
      default: "Telegram Bot",
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk performa query
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ telegramId: 1, createdAt: -1 });
activitySchema.index({ type: 1, action: 1 });

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
