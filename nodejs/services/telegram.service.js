const axios = require("axios");
const TELEGRAM_API = `${process.env.TELEGRAM_API}${process.env.TOKEN}`;

const sendMessage = async (chatId, text) => {
  try {
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text,
    });
    return response.data.result; // Return message object for later editing
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return false;
  }
};

const sendChatAction = async (chatId, action = "typing") => {
  try {
    await axios.post(`${TELEGRAM_API}/sendChatAction`, {
      chat_id: chatId,
      action: action, // typing, upload_photo, record_video, etc.
    });
    return true;
  } catch (error) {
    console.error("Error sending chat action:", error);
    return false;
  }
};

const sendWaitingMessage = async (chatId) => {
  try {
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: "⏳ Tunggu sebentar, sedang memproses...",
    });
    return response.data.result; // Return message object with message_id
  } catch (error) {
    console.error("Error sending waiting message:", error);
    return null;
  }
};

const editMessage = async (chatId, messageId, newText) => {
  try {
    await axios.post(`${TELEGRAM_API}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
    });
    return true;
  } catch (error) {
    console.error("Error editing message:", error);
    return false;
  }
};

module.exports = {
  sendMessage,
  sendChatAction,
  sendWaitingMessage,
  editMessage,
};
