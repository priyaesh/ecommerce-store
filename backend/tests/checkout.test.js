const request = require("supertest");
const app = require("../app");
const Product = require("../models/Product");

describe("Checkout API", () => {
  beforeEach(async () => {
    // Clear existing products
    await Product.deleteMany({});
    
    // Create test products
    await Product.insertMany([
      {
        id: "checkout-product-1",
        name: "Checkout Product 1",
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
      {
        id: "checkout-product-2",
        name: "Checkout Product 2",
        price: 50,
        category: "Test",
        rating: 4.0,
        reviews: 5,
        tagline: "Test tagline 2",
        stock: 5,
        colors: ["Blue"],
        image: "https://example.com/image2.jpg",
        description: "Test description 2",
        features: ["Feature 2"],
        featured: false,
      },
    ]);
  });

  describe("POST /api/checkout", () => {
    it("should process checkout and reduce stock", async () => {
      const product1 = await Product.findOne({ id: "checkout-product-1" });
      const product2 = await Product.findOne({ id: "checkout-product-2" });
      const initialStock1 = product1.stock;
      const initialStock2 = product2.stock;

      const res = await request(app)
        .post("/api/checkout")
        .send({
          email: "customer@example.com",
          items: [
            { id: "checkout-product-1", quantity: 2 },
            { id: "checkout-product-2", quantity: 1 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.orderId).toBeDefined();
      expect(res.body.email).toBe("customer@example.com");
      expect(res.body.items).toHaveLength(2);
      expect(res.body.breakdown.subtotal).toBe(250); // (100 * 2) + (50 * 1)
      expect(res.body.breakdown.shipping).toBe(24);
      expect(res.body.breakdown.tax).toBeGreaterThan(0);

      // Verify stock was reduced
      const updatedProduct1 = await Product.findOne({ id: "checkout-product-1" });
      const updatedProduct2 = await Product.findOne({ id: "checkout-product-2" });
      expect(updatedProduct1.stock).toBe(initialStock1 - 2);
      expect(updatedProduct2.stock).toBe(initialStock2 - 1);
    });

    it("should reject checkout with empty cart", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .send({
          email: "customer@example.com",
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cart items are required");
    });

    it("should reject checkout with out of stock items", async () => {
      // Set product to out of stock
      await Product.findOneAndUpdate(
        { id: "checkout-product-1" },
        { stock: 0 }
      );

      const res = await request(app)
        .post("/api/checkout")
        .send({
          email: "customer@example.com",
          items: [{ id: "checkout-product-1", quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("out of stock");
      expect(res.body.stockErrors).toBeDefined();
    });

    it("should reject checkout with insufficient stock", async () => {
      // Set product stock to 1
      await Product.findOneAndUpdate(
        { id: "checkout-product-1" },
        { stock: 1 }
      );

      const res = await request(app)
        .post("/api/checkout")
        .send({
          email: "customer@example.com",
          items: [{ id: "checkout-product-1", quantity: 5 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("out of stock");
    });

    it("should reject checkout with non-existent products", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .send({
          email: "customer@example.com",
          items: [{ id: "non-existent-product", quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Product not found");
    });

    it("should calculate free shipping for orders over $400", async () => {
      // Create expensive product
      await Product.create({
        id: "expensive-product",
        name: "Expensive Product",
        price: 500,
        category: "Test",
        rating: 4.5,
        reviews: 10,
        tagline: "Test",
        stock: 10,
        colors: ["Red"],
        image: "https://example.com/image.jpg",
        description: "Test",
        features: ["Feature"],
        featured: false,
      });

      const res = await request(app)
        .post("/api/checkout")
        .send({
          email: "customer@example.com",
          items: [{ id: "expensive-product", quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.breakdown.shipping).toBe(0);
    });
  });
});

