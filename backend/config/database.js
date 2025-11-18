const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use test database in test environment
    const mongoURI =
      process.env.NODE_ENV === "test"
        ? process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/ecommerce-store-test"
        : process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce-store";

    const conn = await mongoose.connect(mongoURI, {
      // These options are recommended for Mongoose 6+
      // Remove if using older versions
    });

    if (process.env.NODE_ENV !== "test") {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    return conn;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;

