const Pusher = require("pusher");

const hasConfig =
  !!process.env.PUSHER_APP_ID &&
  !!process.env.PUSHER_KEY &&
  !!process.env.PUSHER_SECRET &&
  !!process.env.PUSHER_CLUSTER;

const pusher = hasConfig
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    })
  : null;

async function triggerQueueEvent(eventName, payload) {
  if (!pusher) return;
  await pusher.trigger("queue-updates", eventName, payload);
}

module.exports = {
  triggerQueueEvent,
};
