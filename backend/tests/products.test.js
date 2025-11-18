const request = require("supertest");
const app = require("../app");
const Product = require("../models/Product");

describe("Products API", () => {
  beforeEach(async () => {
    // Clear existing products first
    await Product.deleteMany({});
    
    // Seed test products
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
        colors: ["Red", "Blue"],
        image: "https://example.com/image.jpg",
        description: "Test description",
        features: ["Feature 1", "Feature 2"],
        featured: true,
      },
      {
        id: "test-product-2",
        name: "Test Product 2",
        price: 200,
        category: "Test",
        rating: 4.8,
        reviews: 15,
        tagline: "Test tagline 2",
        stock: 10,
        colors: ["Green"],
        image: "https://example.com/image2.jpg",
        description: "Test description 2",
        features: ["Feature 3"],
        featured: false,
      },
    ]);
  });

  describe("GET /api/products", () => {
    it("should return all products", async () => {
      const res = await request(app).get("/api/products");
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
      expect(res.body.meta.categories).toContain("Test");
    });

    it("should filter products by category", async () => {
      const res = await request(app).get("/api/products?category=Test");
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it("should filter featured products", async () => {
      const res = await request(app).get("/api/products?featured=true");
      
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((p) => p.featured)).toBe(true);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return a single product by id", async () => {
      const res = await request(app).get("/api/products/test-product-1");
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe("test-product-1");
      expect(res.body.name).toBe("Test Product 1");
      expect(res.body.price).toBe(100);
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/products/non-existent");
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Product not found");
    });
  });

  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const res = await request(app).get("/api/health");
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.database).toBe("connected");
      expect(typeof res.body.products).toBe("number");
    });
  });
});

