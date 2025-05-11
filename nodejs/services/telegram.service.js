const axios = require("axios");
const TELEGRAM_API = `${process.env.TELEGRAM_API}${process.env.TOKEN}`;

const sendMessage = async (chatId, text) => {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text,
    });
    return true;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return false;
  }
};

module.exports = { sendMessage };
