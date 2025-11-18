const mongoose = require("mongoose");
const connectDB = require("../config/database");

// Connect to test database before all tests
beforeAll(async () => {
  await connectDB();
});

// Clear database after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

