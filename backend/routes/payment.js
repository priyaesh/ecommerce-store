const express = require("express");
const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder"
);
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/payment/create-intent
// @desc    Create Stripe payment intent
// @access  Public (can work with or without auth)
router.post("/create-intent", async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
      return res.status(500).json({
        success: false,
        error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in your .env file.",
      });
    }

    const { items = [], email } = req.body || {};

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({
        success: false,
        error: "Cart items are required",
      });
    }

    // If user is authenticated, use their email, otherwise use provided email
    let userEmail = email || "guest@checkout.com";
    if (req.headers.authorization) {
      try {
        const jwt = require("jsonwebtoken");
        const User = require("../models/User");
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key"
        );
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
          success: false,
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
        success: false,
        error: "Some items are out of stock or insufficient quantity",
        stockErrors,
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

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: "usd",
      metadata: {
        email: userEmail,
        items: JSON.stringify(
          items.map((item) => ({
            id: item.id,
            quantity: item.quantity || 1,
          }))
        ),
        orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
      },
      receipt_email: userEmail,
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderDetails: {
        orderId: paymentIntent.metadata.orderId,
        email: userEmail,
        items: computedItems,
        breakdown: { subtotal, shipping, tax, total },
        estimatedArrival: "3-5 business days",
      },
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    
    // Provide more detailed error messages
    let errorMessage = "Failed to create payment intent";
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = `Stripe error: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// @route   POST /api/payment/confirm
// @desc    Confirm payment and reduce stock
// @access  Public
router.post("/confirm", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Payment intent ID is required",
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: "Payment not completed",
        status: paymentIntent.status,
      });
    }

    // Parse items from metadata
    const items = JSON.parse(paymentIntent.metadata.items || "[]");

    // Fetch products
    const productIds = items.map((item) => item.id);
    const products = await Product.find({ id: { $in: productIds } });

    // Create a map for quick lookup
    const productMap = {};
    products.forEach((product) => {
      productMap[product.id] = product;
    });

    // Reduce stock for all items
    const stockUpdates = [];
    try {
      for (const item of items) {
        const product = productMap[item.id];
        if (product) {
          const oldStock = product.stock;
          const quantity = item.quantity || 1;
          await product.reduceStock(quantity);
          const newStock = product.stock;
          
          stockUpdates.push({
            productId: product.id,
            productName: product.name,
            quantity,
            oldStock,
            newStock,
          });
          
          console.log(`Stock updated: ${product.name} - ${oldStock} → ${newStock} (sold ${quantity})`);
        }
      }
    } catch (error) {
      console.error("Error reducing stock:", error);
      // Note: Payment already succeeded, so we should handle this gracefully
      // In production, you might want to implement a refund or queue for manual review
      return res.status(500).json({
        success: false,
        error: "Payment succeeded but failed to update inventory",
        paymentIntentId,
        details: error.message,
      });
    }

    console.log(`Order ${paymentIntent.metadata.orderId} confirmed. Stock updated for ${stockUpdates.length} products.`);

    res.json({
      success: true,
      orderId: paymentIntent.metadata.orderId,
      email: paymentIntent.metadata.email,
      paymentIntentId,
      message: "Order confirmed and inventory updated",
      stockUpdates, // Include stock update details in response
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to confirm payment",
    });
  }
});

module.exports = router;

