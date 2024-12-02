const request = require("supertest");
const app = require("../app");
const dbHandler = require("./testSetup");
const User = require("../models/User");
const Course = require("../models/Course");
const Classroom = require("../models/Classroom");
const TimeSlot = require("../models/TimeSlot");

describe("Seed API", () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe("POST /api/seed/initialize", () => {
    it("should initialize all demo data", async () => {
      const response = await request(app).post("/api/seed/initialize");

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("数据初始化成功");

      // 验证各个集合中的数据
      const users = await User.find();
      const courses = await Course.find();
      const classrooms = await Classroom.find();
      const timeSlots = await TimeSlot.find();

      expect(users.length).toBeGreaterThan(0);
      expect(courses.length).toBeGreaterThan(0);
      expect(classrooms.length).toBeGreaterThan(0);
      expect(timeSlots.length).toBeGreaterThan(0);
    });
  });
});
