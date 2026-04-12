const Service = require("../models/Service");
const ServiceBranch = require("../models/ServiceBranch");

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

// UPDATE SERVICE
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
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

    const link = await ServiceBranch.create({
      serviceId,
      branchId,
      customProcessingTime,
      capacityPerDay,
    });

    res.status(201).json(link);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};