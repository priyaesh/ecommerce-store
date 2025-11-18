const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

describe("Authentication API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.user.name).toBe("Test User");
      expect(res.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it("should not register user with duplicate email", async () => {
      // Create first user
      await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "duplicate@example.com",
        password: "password123",
      });

      // Try to register again with same email
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Another User",
          email: "duplicate@example.com",
          password: "password456",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already exists");
    });

    it("should require all fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          // Missing email and password
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "login@example.com",
        password: "password123",
      });
    });

    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "password123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("login@example.com");
    });

    it("should not login with invalid password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid credentials");
    });

    it("should not login with non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/me", () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Register and login to get token
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "me@example.com",
          password: "password123",
        });
      
      token = registerRes.body.token;
      userId = registerRes.body.user.id;
    });

    it("should get current user with valid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(userId);
      expect(res.body.user.email).toBe("me@example.com");
    });

    it("should not get user without token", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

