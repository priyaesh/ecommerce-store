require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const Product = require("./models/Product");
const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const paymentRoutes = require("./routes/payment");

const app = express();

// Connect to MongoDB (only in non-test environment)
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

app.use(cors());
app.use(express.json());

// Auth routes
app.use("/api/auth", authRoutes);

// Inventory routes
app.use("/api/inventory", inventoryRoutes);

// Payment routes
app.use("/api/payment", paymentRoutes);

// Health check endpoint
app.get("/api/health", async (_req, res) => {
  try {
    const productCount = await Product.countDocuments();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      products: productCount,
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get all products with optional filters
app.get("/api/products", async (req, res) => {
  try {
    const { category, featured } = req.query;

    // Build query
    const query = {};
    if (category) {
      query.category = { $regex: new RegExp(category, "i") };
    }
    if (featured === "true") {
      query.featured = true;
    }

    // Fetch products
    const products = await Product.find(query).sort({ createdAt: -1 });

    // Get all unique categories for metadata
    const allProducts = await Product.find({});
    const categories = [...new Set(allProducts.map((p) => p.category))];

    res.json({
      data: products,
      meta: {
        total: products.length,
        categories: categories,
        featuredCount: products.filter((p) => p.featured).length,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get single product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Checkout endpoint (optionally protected - can work with or without auth)
app.post("/api/checkout", async (req, res) => {
  try {
    const { items = [], email } = req.body || {};

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    // If user is authenticated, use their email, otherwise use provided email
    let userEmail = email || "guest@checkout.com";
    if (req.headers.authorization) {
      try {
        const jwt = require("jsonwebtoken");
        const User = require("./models/User");
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await User.findById(decoded.id);
        if (user) {
          userEmail = user.email;
        }
      } catch (error) {
        // If token is invalid, continue with guest checkout
      }
    }

    // Fetch products from database
    const productIds = items.map((item) => item.id);
    const products = await Product.find({ id: { $in: productIds } });

    // Create a map for quick lookup
    const productMap = {};
    products.forEach((product) => {
      productMap[product.id] = product;
    });

    // Validate all items exist and check stock
    const stockErrors = [];
    for (const item of items) {
      if (!productMap[item.id]) {
        return res.status(400).json({
          error: `Product not found: ${item.id}`,
        });
      }

      const product = productMap[item.id];
      const quantity = item.quantity || 1;

      if (!product.isInStock(quantity)) {
        stockErrors.push({
          productId: product.id,
          productName: product.name,
          requested: quantity,
          available: product.stock,
        });
      }
    }

    // If any items are out of stock, return error
    if (stockErrors.length > 0) {
      return res.status(400).json({
        error: "Some items are out of stock or insufficient quantity",
        stockErrors,
      });
    }

    // IMPORTANT: Stock is ONLY reduced here during checkout, NOT when adding to cart
    // Reduce stock for all items (transaction-like behavior)
    try {
      for (const item of items) {
        const product = productMap[item.id];
        await product.reduceStock(item.quantity || 1);
      }
    } catch (error) {
      return res.status(400).json({
        error: error.message || "Failed to update inventory",
      });
    }

    // Compute order details
    const computedItems = items.map((line) => {
      const product = productMap[line.id];
      return {
        ...line,
        name: product.name,
        price: product.price,
        lineTotal: product.price * (line.quantity || 1),
      };
    });

    const subtotal = computedItems.reduce(
      (sum, line) => sum + line.lineTotal,
      0
    );
    const shipping = subtotal > 400 ? 0 : 24;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + shipping + tax;

    res.json({
      orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
      email: userEmail,
      items: computedItems,
      breakdown: { subtotal, shipping, tax, total },
      estimatedArrival: "3-5 business days",
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({ error: "Failed to process checkout" });
  }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

module.exports = app;

