const sessionCache = new Map();

module.exports = {
  get: (telegramId) => sessionCache.get(telegramId),
  set: (telegramId, data) => sessionCache.set(telegramId, data),
  delete: (telegramId) => sessionCache.delete(telegramId),
};
