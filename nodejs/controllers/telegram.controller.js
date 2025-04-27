const UserExpenseTracker = require("../models/user");
const TELEGRAM_API = `${process.env.TELEGRAM_API}${process.env.TOKEN}`;

const getTelegramIdHook = async (req, res) => {
  const { message } = req.body;
  console.log("message:", message);

  if (
    (message && message.text === "/start login") ||
    message.text === "/start"
  ) {
    const telegramId = message.from.id;
    const username = message.from.username;

    try {
      let user = await UserExpenseTracker.findOne({ telegramId });

      if (!user) {
        user = new UserExpenseTracker({
          telegramId,
          username,
        });
        await user.save();
      }

      // Kirim pesan ke user
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: telegramId,
        text: `Welcome! Your Telegram ID is ${telegramId}. Copy and paste it in the login form.`,
      });
    } catch (error) {
      console.error("Error handling /start:", error);
    }
  }

  res.sendStatus(200); // Tetap harus response 200 ke Telegram
};

module.exports = { getTelegramIdHook };
