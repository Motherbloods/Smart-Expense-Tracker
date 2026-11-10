const path = require("path");

const chain = (result) => {
  const api = {
    select: () => api,
    lean: () => api,
    sort: () => api,
    limit: () => api,
    populate: () => api,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };
  return api;
};

const stubModule = (relativePath, exportsValue) => {
  const resolved = require.resolve(path.join(__dirname, "..", relativePath));
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: exportsValue,
  };
};

const setTestEnv = () => {
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "test-access-secret-test-access-secret-1";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-test-refresh-secret-2";
  process.env.URL = "mongodb://unused";
  process.env.TOKEN = "123:abc";
  process.env.TELEGRAM_API = "https://api.telegram.org/bot";
  process.env.PUSHER_APP_ID = "1";
  process.env.PUSHER_KEY = "key";
  process.env.PUSHER_SECRET = "secret";
  process.env.PUSHER_CLUSTER = "ap1";
  process.env.ALLOWED_ORIGINS = "https://app.example.test";
  process.env.TELEGRAM_WEBHOOK_SECRET = "hook-secret";
};

module.exports = { chain, stubModule, setTestEnv };
