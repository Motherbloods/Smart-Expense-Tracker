const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false });

module.exports = {
  get: (telegramId) => cache.get(telegramId),
  set: (telegramId, data) => cache.set(telegramId, data),
  delete: (telegramId) => cache.del(telegramId),
};
