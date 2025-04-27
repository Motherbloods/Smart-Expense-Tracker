const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("MongoDB connected successfully!");
    await mongoose.connect(process.env.URL);
  } catch (e) {
    console.log("Error connecting to MongoDB:", e.message);
    process.exit(1);
  }
};

module.exports = connectDB;
