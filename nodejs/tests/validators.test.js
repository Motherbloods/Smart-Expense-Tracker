const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseAmount,
  parseNonNegativeAmount,
  isObjectId,
  isTelegramId,
  parseMonthYear,
  parseDate,
  parseConfidence,
  escapeRegex,
  clampInt,
  sanitizeText,
} = require("../utils/validators");

test("parseAmount accepts positive finite numbers and rounds to two decimals", () => {
  assert.equal(parseAmount(15000), 15000);
  assert.equal(parseAmount("15000"), 15000);
  assert.equal(parseAmount(10.456), 10.46);
});

test("parseAmount rejects invalid, negative, zero, huge and non-scalar values", () => {
  for (const value of ["", " ", "abc", -5, 0, NaN, Infinity, 1e13, null, undefined, {}, [], [5], true]) {
    assert.equal(parseAmount(value), null, String(value));
  }
});

test("parseNonNegativeAmount allows zero", () => {
  assert.equal(parseNonNegativeAmount(0), 0);
  assert.equal(parseNonNegativeAmount("250000"), 250000);
  assert.equal(parseNonNegativeAmount(-1), null);
});

test("id validators", () => {
  assert.equal(isObjectId("507f1f77bcf86cd799439011"), true);
  assert.equal(isObjectId("507f1f77bcf86cd79943901"), false);
  assert.equal(isObjectId({ $ne: "x" }), false);
  assert.equal(isTelegramId("123456789"), true);
  assert.equal(isTelegramId("12a"), false);
  assert.equal(isTelegramId(123), false);
});

test("parseMonthYear", () => {
  assert.deepEqual(parseMonthYear(undefined, undefined), { ok: true, range: null });
  assert.equal(parseMonthYear("2", "2026").ok, true);
  assert.equal(parseMonthYear("0", "2026").ok, false);
  assert.equal(parseMonthYear("5", undefined).ok, false);
  assert.equal(parseMonthYear("x", "2026").ok, false);
});

test("parseDate and parseConfidence", () => {
  assert.ok(parseDate("2026-05-10") instanceof Date);
  assert.equal(parseDate("not-a-date"), null);
  assert.equal(parseDate("1900-01-01"), null);
  assert.equal(parseDate({}), null);
  assert.equal(parseConfidence(2), 1);
  assert.equal(parseConfidence(-1), 0);
  assert.equal(parseConfidence("x"), 1);
  assert.equal(parseConfidence(undefined), 1);
});

test("text helpers", () => {
  assert.equal(escapeRegex("a.b*c"), "a\\.b\\*c");
  assert.equal(clampInt("500", 1, 200, 100), 200);
  assert.equal(clampInt("abc", 1, 200, 100), 100);
  assert.equal(sanitizeText("  hello  ", 3), "hel");
  assert.equal(sanitizeText({ a: 1 }, 10), "");
});
