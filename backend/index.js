const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  console.log(`MongoDB connection: ${process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-store"}`);
});
