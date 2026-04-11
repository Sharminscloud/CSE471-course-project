import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Branch from "./models/Branch.js";
import Service from "./models/Service.js";

dotenv.config();
await connectDB();

await Branch.deleteMany();
await Service.deleteMany();

await Branch.insertMany([
  {
    name: "Dhaka Main Branch",
    code: "DHK",
    dailyCapacity: 10
  },
  {
    name: "Chittagong Branch",
    code: "CTG",
    dailyCapacity: 8
  }
]);

await Service.insertMany([
  {
    name: "Passport Renewal",
    code: "PASS",
    averageDurationMinutes: 15,
    prioritySupported: true
  },
  {
    name: "NID Correction",
    code: "NID",
    averageDurationMinutes: 20,
    prioritySupported: false
  }
]);

console.log("Seed data inserted successfully");
process.exit();