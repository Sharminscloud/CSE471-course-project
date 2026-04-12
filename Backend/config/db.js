const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }

    // Clean the URI
    mongoURI = mongoURI.trim();
    if (mongoURI.startsWith("MONGO_URI=")) {
      mongoURI = mongoURI.substring(10);
    }

    console.log("📡 Connecting to MongoDB...");
    console.log("🔗 URI starts with:", mongoURI.substring(0, 40) + "...");

    const conn = await mongoose.connect(mongoURI, {
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error("Error Type:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code);
    
    setTimeout(() => process.exit(1), 2000);
  }
};

module.exports = connectDB;