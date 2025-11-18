const request = require("supertest");
const app = require("../app");
const Product = require("../models/Product");

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: "pi_test_123",
        client_secret: "pi_test_123_secret",
        status: "requires_payment_method",
        metadata: {
          email: "test@example.com",
          items: JSON.stringify([
            { id: "test-product-1", quantity: 2 },
          ]),
          orderId: "ORD-TEST123",
        },
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: "pi_test_123",
        status: "succeeded",
        metadata: {
          email: "test@example.com",
          items: JSON.stringify([
            { id: "test-product-1", quantity: 2 },
          ]),
          orderId: "ORD-TEST123",
        },
      }),
    },
  }));
});

describe("Payment API", () => {
  beforeEach(async () => {
    // Clear existing products
    await Product.deleteMany({});
    
    // Create test products
    await Product.insertMany([
      {
        id: "test-product-1",
        name: "Test Product 1",
        price: 100,
        category: "Test",
        rating: 4.5,
        reviews: 10,
        tagline: "Test tagline",
        stock: 20,
        colors: ["Red"],
        image: "https://example.com/image.jpg",
        description: "Test description",
        features: ["Feature 1"],
        featured: false,
      },
    ]);
  });

  describe("POST /api/payment/create-intent", () => {
    it("should create payment intent with valid items", async () => {
      const res = await request(app)
        .post("/api/payment/create-intent")
        .send({
          email: "test@example.com",
          items: [{ id: "test-product-1", quantity: 2 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.clientSecret).toBeDefined();
      expect(res.body.orderDetails).toBeDefined();
      expect(res.body.orderDetails.items).toHaveLength(1);
    });

    it("should reject empty cart", async () => {
      const res = await request(app)
        .post("/api/payment/create-intent")
        .send({
          email: "test@example.com",
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Cart items are required");
    });

    it("should reject out of stock items", async () => {
      // Set product to out of stock
      await Product.findOneAndUpdate(
        { id: "test-product-1" },
        { stock: 0 }
      );

      const res = await request(app)
        .post("/api/payment/create-intent")
        .send({
          email: "test@example.com",
          items: [{ id: "test-product-1", quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("out of stock");
    });

    it("should reject non-existent products", async () => {
      const res = await request(app)
        .post("/api/payment/create-intent")
        .send({
          email: "test@example.com",
          items: [{ id: "non-existent", quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Product not found");
    });
  });

  describe("POST /api/payment/confirm", () => {
    it("should confirm payment and reduce stock", async () => {
      const product = await Product.findOne({ id: "test-product-1" });
      expect(product).not.toBeNull();
      const initialStock = product.stock;

      // Mock successful payment intent
      const stripe = require("stripe");
      const mockStripe = stripe();
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_123",
        status: "succeeded",
        metadata: {
          email: "test@example.com",
          items: JSON.stringify([
            { id: "test-product-1", quantity: 2 },
          ]),
          orderId: "ORD-TEST123",
        },
      });

      const res = await request(app)
        .post("/api/payment/confirm")
        .send({
          paymentIntentId: "pi_test_123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orderId).toBe("ORD-TEST123");

      // Verify stock was reduced
      const updatedProduct = await Product.findOne({ id: "test-product-1" });
      expect(updatedProduct.stock).toBe(initialStock - 2);
    });

    it("should require payment intent ID", async () => {
      const res = await request(app)
        .post("/api/payment/confirm")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

