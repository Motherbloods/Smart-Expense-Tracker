const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1990302",
  key: "1d3d59fbfc0171ca6444",
  secret: "e363532c47a63d88f822",
  cluster: "ap1",
  useTLS: true,
});
module.exports = pusher;
