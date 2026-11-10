const test = require("node:test");
const assert = require("node:assert/strict");
const { stubModule, setTestEnv } = require("./helpers");

setTestEnv();

const store = new Map();

const matches = (record, filter) => {
  if (filter.telegramId && record.telegramId !== filter.telegramId) return false;
  if (filter._id && record._id !== filter._id) return false;
  if (filter.codeHash && record.codeHash !== filter.codeHash) return false;
  if (filter.expiresAt && !(record.expiresAt > filter.expiresAt.$gt)) return false;
  if (filter.attempts && !(record.attempts < filter.attempts.$lt)) return false;
  return true;
};

stubModule("models/loginCode.js", {
  findOne: (filter) => {
    const record = store.get(filter.telegramId) || null;
    const api = { select: () => api, lean: () => api, then: (r, j) => Promise.resolve(record).then(r, j) };
    return api;
  },
  findOneAndUpdate: async (filter, update) => {
    if (update.$set) {
      const existing = store.get(filter.telegramId) || { _id: `id-${Math.random()}` };
      const record = { ...existing, telegramId: filter.telegramId, ...update.$set };
      store.set(filter.telegramId, record);
      return record;
    }
    const record = store.get(filter.telegramId);
    if (!record || !matches(record, filter)) return null;
    record.attempts += update.$inc.attempts;
    return { ...record };
  },
  deleteOne: async (filter) => {
    const record = store.get(filter.telegramId) || [...store.values()].find((r) => r._id === filter._id);
    if (record && matches(record, filter)) {
      store.delete(record.telegramId);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  },
});

const { issueLoginCode, verifyLoginCode, generateCode, MAX_ATTEMPTS } = require("../utils/loginCode");

test("generated codes are six digits", () => {
  for (let i = 0; i < 200; i += 1) {
    assert.match(generateCode(), /^\d{6}$/);
  }
});

test("a code works once and then is consumed", async () => {
  store.clear();
  const { code } = await issueLoginCode("111");
  assert.equal(await verifyLoginCode("111", code), true);
  assert.equal(await verifyLoginCode("111", code), false);
});

test("a code cannot be used for another telegram id", async () => {
  store.clear();
  const { code } = await issueLoginCode("111");
  await issueLoginCode("222");
  assert.equal(await verifyLoginCode("222", code), false);
  assert.equal(await verifyLoginCode("111", code), true);
});

test("codes are rate limited per attempt count and then locked", async () => {
  store.clear();
  const { code } = await issueLoginCode("111");
  const wrong = code === "000000" ? "000001" : "000000";
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    assert.equal(await verifyLoginCode("111", wrong), false);
  }
  assert.equal(await verifyLoginCode("111", code), false);
});

test("expired codes are rejected", async () => {
  store.clear();
  const { code } = await issueLoginCode("111");
  store.get("111").expiresAt = new Date(Date.now() - 1000);
  assert.equal(await verifyLoginCode("111", code), false);
});

test("requesting codes repeatedly is throttled", async () => {
  store.clear();
  const first = await issueLoginCode("111");
  const second = await issueLoginCode("111");
  assert.equal(first.cooldown, false);
  assert.equal(second.cooldown, true);
  assert.equal(second.code, null);
});
