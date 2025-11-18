const express = require("express");
const Product = require("../models/Product");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/inventory/products/:id/stock
// @desc    Get stock level for a product
// @access  Public
router.get("/products/:id/stock", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      productId: product.id,
      stock: product.stock,
      inStock: product.stock > 0,
      lowStock: product.stock > 0 && product.stock <= 10,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get products with low stock
// @access  Private (Admin)
router.get("/low-stock", protect, authorize("admin"), async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await Product.getLowStock(threshold);

    res.json({
      success: true,
      count: products.length,
      threshold,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        category: p.category,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

// @route   GET /api/inventory/out-of-stock
// @desc    Get out of stock products
// @access  Private (Admin)
router.get("/out-of-stock", protect, authorize("admin"), async (req, res) => {
  try {
    const products = await Product.getOutOfStock();

    res.json({
      success: true,
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        category: p.category,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

// @route   PUT /api/inventory/products/:id/stock
// @desc    Update product stock (Admin only)
// @access  Private (Admin)
router.put("/products/:id/stock", protect, authorize("admin"), async (req, res) => {
  try {
    const { stock, action } = req.body; // action: 'set', 'add', 'subtract'

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid stock value is required",
      });
    }

    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let newStock;
    switch (action) {
      case "add":
        newStock = product.stock + stock;
        break;
      case "subtract":
        newStock = Math.max(0, product.stock - stock);
        break;
      case "set":
      default:
        newStock = stock;
        break;
    }

    product.stock = newStock;
    await product.save();

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        stock: product.stock,
      },
      message: `Stock updated to ${product.stock}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

// @route   GET /api/inventory/summary
// @desc    Get inventory summary (Admin only)
// @access  Private (Admin)
router.get("/summary", protect, authorize("admin"), async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const inStockProducts = await Product.countDocuments({ stock: { $gt: 0 } });
    const lowStockProducts = await Product.countDocuments({ stock: { $lte: 10, $gt: 0 } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    
    const totalStock = await Product.aggregate([
      { $group: { _id: null, total: { $sum: "$stock" } } }
    ]);

    res.json({
      success: true,
      summary: {
        totalProducts,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStock: totalStock[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

module.exports = router;

