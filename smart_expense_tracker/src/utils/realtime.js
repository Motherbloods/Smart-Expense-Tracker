import axiosInstance from "../api/axiosInstance";

const authorize = ({ socketId, channelName }, callback) => {
  axiosInstance
    .post("/pusher/auth", { socket_id: socketId, channel_name: channelName })
    .then((response) => callback(null, response.data))
    .catch((error) => callback(error, null));
};

export const createUserChannel = (telegramId) => {
  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER;
  const bindings = [];
  let client = null;
  let channel = null;
  let closed = false;

  if (key && cluster && telegramId) {
    import("pusher-js")
      .then((module) => {
        if (closed) return;
        const Pusher = module.default ?? module;
        client = new Pusher(key, {
          cluster,
          forceTLS: true,
          channelAuthorization: { customHandler: authorize },
        });
        channel = client.subscribe(`private-user-${telegramId}`);
        bindings.forEach(([event, handler]) => channel.bind(event, handler));
      })
      .catch(() => {});
  }

  return {
    bind(event, handler) {
      bindings.push([event, handler]);
      if (channel) channel.bind(event, handler);
    },
    unbind_all() {
      bindings.length = 0;
      if (channel) channel.unbind_all();
    },
    unsubscribe() {
      closed = true;
      if (client) {
        client.disconnect();
        client = null;
        channel = null;
      }
    },
  };
};

export const EXPENSE_EVENT = import.meta.env.VITE_PUSHER_BIND || "new-expense";
