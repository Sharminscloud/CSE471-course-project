import Branch from "../models/Branch.js";
import Service from "../models/Service.js";
import Token from "../models/Token.js";
import QueueDay from "../models/QueueDay.js";
import { formatTokenNumber } from "../utils/tokenGenerator.js";

export const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({ message: "Failed to load branches" });
  }
};

export const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json(services);
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({ message: "Failed to load services" });
  }
};

export const createToken = async (req, res) => {
  try {
    const { branchId, serviceId, preferredDate, isPriority } = req.body;

    if (!branchId || !serviceId || !preferredDate) {
      return res.status(400).json({
        message: "branchId, serviceId and preferredDate are required",
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const queueDay = await QueueDay.findOneAndUpdate(
      {
        preferredDate,
        branch: branchId,
        service: serviceId,
        isPriority: !!isPriority,
      },
      {
        $inc: { lastNumber: 1 },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const queueNumber = queueDay.lastNumber;
    const tokenNumber = formatTokenNumber({
      isPriority: !!isPriority,
      queueNumber,
    });

    const token = await Token.create({
      tokenNumber,
      branch: branchId,
      service: serviceId,
      preferredDate,
      isPriority: !!isPriority,
      queueNumber,
    });

    const populatedToken = await Token.findById(token._id)
      .populate("branch", "name")
      .populate("service", "name");

    res.status(201).json({
      message: "Token created successfully",
      token: populatedToken,
    });
  } catch (error) {
    console.error("Create token error:", error);
    res.status(500).json({ message: "Failed to create token" });
  }
};