const request = require("supertest");
const app = require("../app");
const Product = require("../models/Product");
const User = require("../models/User");

describe("Inventory API", () => {
  let adminToken;
  let adminUser;

  beforeEach(async () => {
    // Clear existing users
    await User.deleteMany({});
    
    // Create admin user
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    });

    // Login to get token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@test.com",
        password: "password123",
      });
    
    adminToken = loginRes.body.token;
    
    // Clear existing products
    await Product.deleteMany({});

    // Create test products
    await Product.insertMany([
      {
        id: "low-stock-product",
        name: "Low Stock Product",
        price: 50,
        category: "Test",
        rating: 4.0,
        reviews: 5,
        tagline: "Test",
        stock: 5, // Low stock
        colors: ["Red"],
        image: "https://example.com/image.jpg",
        description: "Test",
        features: ["Feature"],
        featured: false,
      },
      {
        id: "out-of-stock-product",
        name: "Out of Stock Product",
        price: 50,
        category: "Test",
        rating: 4.0,
        reviews: 5,
        tagline: "Test",
        stock: 0, // Out of stock
        colors: ["Red"],
        image: "https://example.com/image.jpg",
        description: "Test",
        features: ["Feature"],
        featured: false,
      },
      {
        id: "in-stock-product",
        name: "In Stock Product",
        price: 50,
        category: "Test",
        rating: 4.0,
        reviews: 5,
        tagline: "Test",
        stock: 50, // In stock
        colors: ["Red"],
        image: "https://example.com/image.jpg",
        description: "Test",
        features: ["Feature"],
        featured: false,
      },
    ]);
  });

  describe("GET /api/inventory/products/:id/stock", () => {
    it("should get stock level for a product (public)", async () => {
      const res = await request(app).get(
        "/api/inventory/products/low-stock-product/stock"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stock).toBe(5);
      expect(res.body.inStock).toBe(true);
      expect(res.body.lowStock).toBe(true);
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).get(
        "/api/inventory/products/non-existent/stock"
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/inventory/low-stock", () => {
    it("should get low stock products (admin only)", async () => {
      const res = await request(app)
        .get("/api/inventory/low-stock?threshold=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.products.some((p) => p.id === "low-stock-product")).toBe(
        true
      );
    });

    it("should require admin role", async () => {
      // Create regular user
      const userRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Regular User",
          email: "user@test.com",
          password: "password123",
        });

      const userToken = userRes.body.token;

      const res = await request(app)
        .get("/api/inventory/low-stock")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/inventory/out-of-stock", () => {
    it("should get out of stock products (admin only)", async () => {
      const res = await request(app)
        .get("/api/inventory/out-of-stock")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(
        res.body.products.some((p) => p.id === "out-of-stock-product")
      ).toBe(true);
    });
  });

  describe("PUT /api/inventory/products/:id/stock", () => {
    it("should update product stock (admin only)", async () => {
      const res = await request(app)
        .put("/api/inventory/products/low-stock-product/stock")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          stock: 25,
          action: "set",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.stock).toBe(25);

      // Verify in database
      const product = await Product.findOne({ id: "low-stock-product" });
      expect(product.stock).toBe(25);
    });

    it("should add to stock", async () => {
      const product = await Product.findOne({ id: "low-stock-product" });
      const initialStock = product.stock;

      const res = await request(app)
        .put("/api/inventory/products/low-stock-product/stock")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          stock: 10,
          action: "add",
        });

      expect(res.status).toBe(200);
      expect(res.body.product.stock).toBe(initialStock + 10);
    });

    it("should subtract from stock", async () => {
      const product = await Product.findOne({ id: "in-stock-product" });
      const initialStock = product.stock;

      const res = await request(app)
        .put("/api/inventory/products/in-stock-product/stock")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          stock: 5,
          action: "subtract",
        });

      expect(res.status).toBe(200);
      expect(res.body.product.stock).toBe(initialStock - 5);
    });
  });

  describe("GET /api/inventory/summary", () => {
    it("should get inventory summary (admin only)", async () => {
      const res = await request(app)
        .get("/api/inventory/summary")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalProducts).toBeGreaterThan(0);
      expect(res.body.summary.inStockProducts).toBeGreaterThan(0);
      expect(typeof res.body.summary.totalStock).toBe("number");
    });
  });
});

