const axios = require("axios");
const { getTelegramIdHook } = require("../controllers/telegram.controller");

const fakeRes = {
  status() {
    return this;
  },
  send() {
    return this;
  },
  json() {
    return this;
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startPolling = async () => {
  const api = `${process.env.TELEGRAM_API}${process.env.TOKEN}`;
  await axios.post(`${api}/deleteWebhook`, { drop_pending_updates: false });
  console.log("Telegram polling aktif, webhook dinonaktifkan");

  let offset = 0;
  let running = true;

  const loop = async () => {
    while (running) {
      try {
        const { data } = await axios.post(
          `${api}/getUpdates`,
          { offset, timeout: 30, allowed_updates: ["message"] },
          { timeout: 40000 }
        );
        for (const update of data.result) {
          offset = update.update_id + 1;
          try {
            await getTelegramIdHook({ body: update }, fakeRes);
          } catch (error) {
            console.error("Gagal memproses update:", error.message);
          }
        }
      } catch (error) {
        console.error("Polling error:", error.message);
        await sleep(3000);
      }
    }
  };

  loop();

  return () => {
    running = false;
  };
};

module.exports = { startPolling };