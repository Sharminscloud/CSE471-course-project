const Service = require("../models/service");
const ServiceBranch = require("../models/ServiceBranch");
const Branch = require("../models/branch");
const mongoose = require("mongoose");

// CREATE SERVICE
exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL SERVICES
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL BRANCHES
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE SERVICE
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE SERVICE
exports.deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: "Service deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LINK SERVICE TO BRANCH
exports.linkServiceToBranch = async (req, res) => {
  try {
    const { serviceId, branchId, customProcessingTime, capacityPerDay } = req.body;

    const link = await ServiceBranch.findOneAndUpdate(
      { serviceId, branchId },
      {
        serviceId,
        branchId,
        customProcessingTime,
        capacityPerDay,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(link);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET BRANCH ASSIGNMENTS FOR A SERVICE
exports.getServiceBranches = async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const links = await ServiceBranch.find({ serviceId }).populate(
      "branchId",
      "name location capacity capacityPerDay"
    );

    res.json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REPLACE BRANCH ASSIGNMENTS FOR A SERVICE (CREATE/UPDATE/DELETE)
exports.syncServiceBranches = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { assignments = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const validAssignments = assignments.filter(
      (a) => a?.branchId && mongoose.Types.ObjectId.isValid(a.branchId)
    );
    const requestedBranchIds = validAssignments.map((a) => a.branchId);

    await ServiceBranch.deleteMany({
      serviceId,
      branchId: { $nin: requestedBranchIds },
    });

    const upserts = validAssignments.map((a) =>
      ServiceBranch.findOneAndUpdate(
        { serviceId, branchId: a.branchId },
        {
          serviceId,
          branchId: a.branchId,
          customProcessingTime: a.customProcessingTime,
          capacityPerDay: a.capacityPerDay,
        },
        { upsert: true, new: true, runValidators: true }
      )
    );

    await Promise.all(upserts);

    const updated = await ServiceBranch.find({ serviceId }).populate(
      "branchId",
      "name location capacity capacityPerDay"
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};