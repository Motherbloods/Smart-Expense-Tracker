const { pusher, userChannel } = require("../utils/pusher");

const authorizeChannel = (req, res) => {
  const socketId = req.body?.socket_id;
  const channelName = req.body?.channel_name;

  if (typeof socketId !== "string" || !/^\d+\.\d+$/.test(socketId)) {
    return res.status(400).json({ success: false, message: "Invalid socket_id" });
  }

  if (channelName !== userChannel(req.user.telegramId)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  return res.status(200).json(pusher.authorizeChannel(socketId, channelName));
};

module.exports = { authorizeChannel };
