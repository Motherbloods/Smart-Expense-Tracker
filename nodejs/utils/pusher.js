const Pusher = require("pusher");
require("dotenv").config();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const userChannel = (telegramId) => `private-user-${telegramId}`;

const publishToUser = (telegramId, event, data) => {
  try {
    const result = pusher.trigger(userChannel(telegramId), event, data);
    if (result && typeof result.catch === "function") {
      result.catch((error) => console.error("Pusher publish failed:", error.message));
    }
  } catch (error) {
    console.error("Pusher publish failed:", error.message);
  }
};

module.exports = pusher;
module.exports.pusher = pusher;
module.exports.userChannel = userChannel;
module.exports.publishToUser = publishToUser;
