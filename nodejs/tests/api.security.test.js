const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { chain, stubModule, setTestEnv } = require("./helpers");

setTestEnv();

const users = {
  "111": { telegramId: "111", role: "user", tokenVersion: 0, username: "alice", budgetMontly: 5 },
  "222": { telegramId: "222", role: "user", tokenVersion: 0, username: "bob", budgetMontly: 9 },
  "999": { telegramId: "999", role: "admin", tokenVersion: 0, username: "root", budgetMontly: 0 },
};

const calls = { activityFind: [], userUpdate: [], expenseFind: [] };

stubModule("models/user.js", {
  findOne: (filter) => chain(users[filter.telegramId] ? { ...users[filter.telegramId] } : null),
  find: () => chain(Object.values(users)),
  countDocuments: async () => 3,
  findOneAndUpdate: (filter, update) => {
    calls.userUpdate.push({ filter, update });
    return chain({ telegramId: filter.telegramId, budgetMontly: update.$set.budgetMontly });
  },
  updateOne: async () => ({ modifiedCount: 1 }),
});
stubModule("models/activity.js", Object.assign(function Activity() {}, {
  find: (query) => {
    calls.activityFind.push(query);
    return chain([]);
  },
  aggregate: async () => [],
}));
stubModule("models/expense.js", {
  find: (query) => {
    calls.expenseFind.push(query);
    return chain([]);
  },
  aggregate: async () => [],
});
stubModule("models/income.js", { find: () => chain([]), aggregate: async () => [] });
stubModule("models/loginCode.js", {
  findOne: () => chain(null),
  findOneAndUpdate: async () => null,
  deleteOne: async () => ({ deletedCount: 0 }),
});

const app = require("../app");

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

const accessToken = (telegramId, overrides = {}) =>
  jwt.sign(
    { telegramId, tv: 0, typ: "access", ...overrides },
    process.env.JWT_SECRET,
    { expiresIn: "5m", algorithm: "HS256" }
  );

const request = (path, { method = "GET", token, body, headers = {} } = {}) =>
  fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Cookie: `accessToken=${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

test("protected endpoints reject requests without a token", async () => {
  for (const path of ["/expenses", "/incomes", "/activities", "/admin/users", "/getUser/111"]) {
    const res = await request(path);
    assert.equal(res.status, 401, path);
  }
});

test("regular users cannot reach admin endpoints", async () => {
  for (const path of ["/admin/users", "/admin/expenses", "/admin/incomes", "/admin/summary"]) {
    const res = await request(path, { token: accessToken("111") });
    assert.equal(res.status, 403, path);
  }
});

test("admin can reach admin endpoints", async () => {
  const res = await request("/admin/users", { token: accessToken("999") });
  assert.equal(res.status, 200);
  const summary = await request("/admin/summary", { token: accessToken("999") });
  assert.equal(summary.status, 200);
});

test("admin endpoints validate month and year", async () => {
  const res = await request("/admin/expenses?month=13&year=2026", { token: accessToken("999") });
  assert.equal(res.status, 400);
});

test("activities are scoped to the caller unless admin", async () => {
  calls.activityFind.length = 0;
  await request("/activities", { token: accessToken("111") });
  assert.equal(calls.activityFind.at(-1).userId, "111");
  await request("/activities", { token: accessToken("999") });
  assert.equal(calls.activityFind.at(-1).userId, undefined);
});

test("activity search is escaped and filters are whitelisted", async () => {
  calls.activityFind.length = 0;
  await request("/activities?search=.*(a%2B)%2B$&type[$ne]=x&action=drop", { token: accessToken("999") });
  const query = calls.activityFind.at(-1);
  assert.equal(query.type, undefined);
  assert.equal(query.action, undefined);
  assert.equal(query.$or[0].entityName.$regex, "\\.\\*\\(a\\+\\)\\+\\$");
});

test("users cannot read another user's profile", async () => {
  const other = await request("/getUser/222", { token: accessToken("111") });
  assert.equal(other.status, 403);
  const own = await request("/getUser/111", { token: accessToken("111") });
  assert.equal(own.status, 200);
  const adminView = await request("/getUser/222", { token: accessToken("999") });
  assert.equal(adminView.status, 200);
});

test("budget update always targets the authenticated user", async () => {
  calls.userUpdate.length = 0;
  const res = await request("/update-budget", {
    method: "PATCH",
    token: accessToken("111"),
    body: { telegramId: "222", budget: 750000 },
  });
  assert.equal(res.status, 200);
  assert.equal(calls.userUpdate.at(-1).filter.telegramId, "111");
  const invalid = await request("/update-budget", {
    method: "PATCH",
    token: accessToken("111"),
    body: { budget: "abc" },
  });
  assert.equal(invalid.status, 400);
});

test("tokens of the wrong type, version or algorithm are rejected", async () => {
  const wrongType = await request("/expenses", { token: accessToken("111", { typ: "refresh" }) });
  assert.equal(wrongType.status, 401);
  const wrongVersion = await request("/expenses", { token: accessToken("111", { tv: 5 }) });
  assert.equal(wrongVersion.status, 401);
  const unsigned = jwt.sign({ telegramId: "999", tv: 0, typ: "access" }, "", { algorithm: "none" });
  const none = await request("/admin/users", { token: unsigned });
  assert.equal(none.status, 401);
  const refreshSecret = jwt.sign({ telegramId: "999", tv: 0, typ: "access" }, process.env.JWT_REFRESH_SECRET);
  const forged = await request("/admin/users", { token: refreshSecret });
  assert.equal(forged.status, 401);
});

test("malformed ids are rejected before reaching the database", async () => {
  const put = await request("/not-an-id", { method: "PUT", token: accessToken("111"), body: { name: "x" } });
  assert.equal(put.status, 400);
  const del = await request("/incomes/zzz", { method: "DELETE", token: accessToken("111") });
  assert.equal(del.status, 400);
});

test("pusher channel authorization only covers the caller's own channel", async () => {
  const foreign = await request("/pusher/auth", {
    method: "POST",
    token: accessToken("111"),
    body: { socket_id: "123.456", channel_name: "private-user-222" },
  });
  assert.equal(foreign.status, 403);
  const publicChannel = await request("/pusher/auth", {
    method: "POST",
    token: accessToken("111"),
    body: { socket_id: "123.456", channel_name: "expenses" },
  });
  assert.equal(publicChannel.status, 403);
  const own = await request("/pusher/auth", {
    method: "POST",
    token: accessToken("111"),
    body: { socket_id: "123.456", channel_name: "private-user-111" },
  });
  assert.equal(own.status, 200);
  const payload = await own.json();
  assert.ok(typeof payload.auth === "string" && payload.auth.startsWith("key:"));
});

test("telegram webhook requires the secret token", async () => {
  const missing = await request("/webhook", { method: "POST", body: { message: { from: { id: 222 }, text: "/start" } } });
  assert.equal(missing.status, 403);
  const wrong = await request("/webhook", {
    method: "POST",
    body: { message: { from: { id: 222 }, text: "/start" } },
    headers: { "X-Telegram-Bot-Api-Secret-Token": "nope" },
  });
  assert.equal(wrong.status, 403);
  const ok = await request("/webhook", {
    method: "POST",
    body: { edited_message: {} },
    headers: { "X-Telegram-Bot-Api-Secret-Token": "hook-secret" },
  });
  assert.equal(ok.status, 200);
});

test("login rejects malformed input and does not enumerate users", async () => {
  const noCode = await request("/login", { method: "POST", body: { telegramId: "111" } });
  assert.equal(noCode.status, 400);
  const objectId = await request("/login", { method: "POST", body: { telegramId: { $ne: null }, code: "123456" } });
  assert.equal(objectId.status, 400);
  const unknown = await request("/login", { method: "POST", body: { telegramId: "555", code: "123456" } });
  const known = await request("/login", { method: "POST", body: { telegramId: "111", code: "123456" } });
  assert.equal(unknown.status, 401);
  assert.equal(known.status, 401);
  assert.deepEqual(await unknown.json(), await known.json());
});

test("cors only allows configured origins and responses are not cacheable", async () => {
  const allowed = await request("/health", { headers: { Origin: "https://app.example.test" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://app.example.test");
  assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
  const denied = await request("/health", { headers: { Origin: "https://evil.example" } });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
  assert.equal(denied.headers.get("cache-control"), "no-store");
  assert.equal(denied.headers.get("x-content-type-options"), "nosniff");
  assert.equal(denied.headers.get("x-powered-by"), null);
});

test("unknown routes and malformed json return clean errors", async () => {
  const missing = await request("/nope", { token: accessToken("111") });
  assert.equal(missing.status, 404);
  const bad = await fetch(`${base}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });
  assert.equal(bad.status, 400);
  const body = await bad.text();
  assert.ok(!body.includes("SyntaxError") && !body.includes("node_modules"));
});

test("login endpoint is rate limited", async () => {
  let last;
  for (let i = 0; i < 14; i += 1) {
    last = await request("/login", { method: "POST", body: { telegramId: "111", code: "000000" } });
  }
  assert.equal(last.status, 429);
});
