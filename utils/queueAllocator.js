const Token = require("../models/Token");

const allocateQueuePosition = async ({
  branch,
  service,
  preferredDate,
  isPriority,
  session,
}) => {
  const existingTokens = await Token.find({
    branch: branch._id,
    preferredDate,
    status: "booked",
  })
    .sort({ queuePosition: 1, createdAt: 1 })
    .session(session);

  const workingMinutesPerDay = 8 * 60;

  const usedMinutes = existingTokens.reduce(
    (sum, token) => sum + (token.serviceDuration || 0),
    0,
  );

  const requestedDuration = service.averageDurationMinutes;

  if (usedMinutes + requestedDuration > workingMinutesPerDay) {
    throw new Error("Selected date is fully booked for this branch.");
  }

  let queuePosition;

  if (isPriority && service.prioritySupported) {
    const priorityTokens = existingTokens.filter((t) => t.isPriority);
    queuePosition = priorityTokens.length + 1;

    for (const token of existingTokens) {
      if (!token.isPriority && token.queuePosition >= queuePosition) {
        token.queuePosition += 1;
        await token.save({ session });
      }
    }
  } else {
    queuePosition = existingTokens.length + 1;
  }

  return queuePosition;
};

module.exports = allocateQueuePosition;
