const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const dbHandler = require("./testSetup");

describe("User API", () => {
  // 在所有测试之前连接数据库
  beforeAll(async () => {
    await dbHandler.connect();
  });

  // 每个测试后清理数据库
  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  // 所有测试结束后关闭数据库
  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe("POST /api/users/register", () => {
    it("should create a new user", async () => {
      const userData = {
        username: "testuser",
        password: "testpass123",
        role: "teacher",
        department: "数学系",
      };

      const response = await request(app)
        .post("/api/users/register")
        .send(userData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.username).toBe(userData.username);
    });

    it("should not create user with duplicate username", async () => {
      const userData = {
        username: "testuser",
        password: "testpass123",
        role: "teacher",
        department: "数学系",
      };

      await User.create(userData);

      const response = await request(app)
        .post("/api/users/register")
        .send(userData);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("message");
    });
  });
});
