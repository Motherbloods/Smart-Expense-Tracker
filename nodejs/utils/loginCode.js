const crypto = require("crypto");
const LoginCode = require("../models/loginCode");

const CODE_TTL_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

const generateCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

const hashCode = (telegramId, code) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`login-code:${telegramId}:${code}`)
    .digest("hex");

const safeEqualHex = (a, b) => {
  const bufferA = Buffer.from(String(a), "hex");
  const bufferB = Buffer.from(String(b), "hex");
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
};

const issueLoginCode = async (telegramId) => {
  const existing = await LoginCode.findOne({ telegramId }).select("issuedAt").lean();
  if (existing && Date.now() - new Date(existing.issuedAt).getTime() < COOLDOWN_MS) {
    return { cooldown: true, code: null };
  }
  const code = generateCode();
  await LoginCode.findOneAndUpdate(
    { telegramId },
    {
      $set: {
        codeHash: hashCode(telegramId, code),
        attempts: 0,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    },
    { upsert: true, new: true }
  );
  return { cooldown: false, code };
};

const verifyLoginCode = async (telegramId, code) => {
  const record = await LoginCode.findOneAndUpdate(
    { telegramId, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true }
  );
  if (!record) return false;
  if (!safeEqualHex(record.codeHash, hashCode(telegramId, code))) return false;
  const consumed = await LoginCode.deleteOne({ _id: record._id, codeHash: record.codeHash });
  return consumed.deletedCount === 1;
};

module.exports = {
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  generateCode,
  hashCode,
  safeEqualHex,
  issueLoginCode,
  verifyLoginCode,
};
