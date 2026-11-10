const mongoose = require("mongoose");

const MAX_AMOUNT = 1e12;

const isObjectId = (value) =>
  typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value) && mongoose.isValidObjectId(value);

const isTelegramId = (value) => typeof value === "string" && /^\d{1,20}$/.test(value);

const parseAmount = (value) => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > MAX_AMOUNT) return null;
  return Math.round(number * 100) / 100;
};

const parseNonNegativeAmount = (value) => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > MAX_AMOUNT) return null;
  return Math.round(number * 100) / 100;
};

const sanitizeText = (value, maxLength) => {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().slice(0, maxLength);
};

const parseDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  if (year < 2000 || year > 2100) return null;
  return date;
};

const parseConfidence = (value) => {
  const number = Number(value);
  if (value === undefined || value === null || !Number.isFinite(number)) return 1;
  return Math.min(1, Math.max(0, number));
};

const parseMonthYear = (month, year) => {
  if (month === undefined && year === undefined) return { ok: true, range: null };
  const m = Number.parseInt(month, 10);
  const y = Number.parseInt(year, 10);
  if (!Number.isInteger(m) || !Number.isInteger(y) || m < 1 || m > 12 || y < 2000 || y > 2100) {
    return { ok: false, range: null };
  }
  return {
    ok: true,
    range: {
      $gte: new Date(y, m - 1, 1),
      $lte: new Date(y, m, 0, 23, 59, 59),
    },
  };
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const clampInt = (value, min, max, fallback) => {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

module.exports = {
  MAX_AMOUNT,
  isObjectId,
  isTelegramId,
  parseAmount,
  parseNonNegativeAmount,
  sanitizeText,
  parseDate,
  parseConfidence,
  parseMonthYear,
  escapeRegex,
  clampInt,
};
