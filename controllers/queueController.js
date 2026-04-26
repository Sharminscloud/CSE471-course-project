const mongoose = require("mongoose");
const QueueToken = require("../models/queueToken");
const { triggerQueueEvent } = require("../services/pusher");

async function getWaitingPosition(token) {
  if (!token || token.status !== "Waiting") return null;

  const position =
    (await QueueToken.countDocuments({
      branchId: token.branchId,
      serviceId: token.serviceId,
      status: "Waiting",
      createdAt: { $lte: token.createdAt },
    })) || 0;

  return position;
}

async function getQueueSummary(branchId, serviceId) {
  const [waitingCount, servingCount, completedCount] = await Promise.all([
    QueueToken.countDocuments({ branchId, serviceId, status: "Waiting" }),
    QueueToken.countDocuments({ branchId, serviceId, status: "Serving" }),
    QueueToken.countDocuments({ branchId, serviceId, status: "Completed" }),
  ]);

  return { waitingCount, servingCount, completedCount };
}

async function emitQueueUpdate(eventName, tokenDoc) {
  const waitingPosition = await getWaitingPosition(tokenDoc);
  const summary = await getQueueSummary(tokenDoc.branchId, tokenDoc.serviceId);

  await triggerQueueEvent(eventName, {
    token: tokenDoc,
    waitingPosition,
    summary,
  });
}

exports.createToken = async (req, res) => {
  try {
    const { serviceId, branchId, citizenName, priority } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(serviceId) ||
      !mongoose.Types.ObjectId.isValid(branchId)
    ) {
      return res.status(400).json({ message: "Invalid service or branch id" });
    }

    const sequence = await QueueToken.countDocuments();
    const tokenNumber = `T-${String(sequence + 1).padStart(4, "0")}`;

    const token = await QueueToken.create({
      tokenNumber,
      serviceId,
      branchId,
      citizenName: citizenName || "",
      priority: priority || "Normal",
      status: "Waiting",
    });

    const populated = await QueueToken.findById(token._id)
      .populate("serviceId", "name category")
      .populate("branchId", "name location");

    await emitQueueUpdate("token-created", populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTokens = async (req, res) => {
  try {
    const { branchId, serviceId, status } = req.query;
    const filter = {};

    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) filter.branchId = branchId;
    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) filter.serviceId = serviceId;
    if (status) filter.status = status;

    const tokens = await QueueToken.find(filter)
      .populate("serviceId", "name category")
      .populate("branchId", "name location")
      .sort({ createdAt: 1 });

    const withPositions = await Promise.all(
      tokens.map(async (token) => ({
        ...token.toObject(),
        waitingPosition: await getWaitingPosition(token),
      }))
    );

    res.json(withPositions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTokenPosition = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid token id" });
    }

    const token = await QueueToken.findById(id)
      .populate("serviceId", "name category")
      .populate("branchId", "name location");

    if (!token) return res.status(404).json({ message: "Token not found" });

    const waitingPosition = await getWaitingPosition(token);
    const summary = await getQueueSummary(token.branchId._id, token.serviceId._id);

    res.json({ token, waitingPosition, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTokenStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid token id" });
    }

    const allowedStatuses = ["Waiting", "Serving", "Completed", "Skipped", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const token = await QueueToken.findByIdAndUpdate(id, { status }, { new: true })
      .populate("serviceId", "name category")
      .populate("branchId", "name location");

    if (!token) return res.status(404).json({ message: "Token not found" });

    await emitQueueUpdate("token-status-updated", token);

    res.json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
