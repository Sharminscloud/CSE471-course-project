const Token = require("../models/Token");
const Appointment = require("../models/Appointment");
const {
  sendQueueAlertNotification,
  sendSlotReminderNotification,
} = require("./notificationService");

const QUEUE_ALERT_THRESHOLD = 3;
const SLOT_REMINDER_MINUTES = 60;

const checkQueueAlerts = async () => {
  try {
    const tokens = await Token.find({
      status: "Waiting",
      queueAlertSent: false,
    }).sort({ queueNumber: 1 });

    for (const token of tokens) {
      if (token.queueNumber <= QUEUE_ALERT_THRESHOLD) {
        await sendQueueAlertNotification(token);
        token.queueAlertSent = true;
        token.status = "Serving";
        await token.save();
      }
    }
  } catch (error) {
    console.error("Queue alert error:", error.message);
  }
};

const checkSlotReminders = async () => {
  try {
    const now = new Date();
    const endWindow = new Date(
      now.getTime() + SLOT_REMINDER_MINUTES * 60 * 1000,
    );

    const appointments = await Appointment.find({
      status: "Confirmed",
      reminderSent: false,
      date: { $gte: now, $lte: endWindow },
    });

    for (const appointment of appointments) {
      await sendSlotReminderNotification(appointment);
      appointment.reminderSent = true;
      await appointment.save();
    }
  } catch (error) {
    console.error("Slot reminder error:", error.message);
  }
};

const startReminderScheduler = () => {
  console.log("✅ Jakia's Reminder Scheduler started");
  setInterval(async () => {
    await checkQueueAlerts();
    await checkSlotReminders();
  }, 60000);
};

module.exports = { startReminderScheduler };
