const request = require("supertest");
const app = require("../app");
const Course = require("../models/Course");
const dbHandler = require("./testSetup");

describe("Course API", () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe("GET /api/courses", () => {
    it("should get all courses", async () => {
      // 创建测试数据
      await Course.create([
        {
          name: "高等数学",
          department: "数学系",
          hours: 4,
          status: "available",
          semester: "2024春季",
        },
        {
          name: "线性代数",
          department: "数学系",
          hours: 3,
          status: "available",
          semester: "2024春季",
        },
      ]);

      const response = await request(app).get("/api/courses");

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
    });
  });

  describe("POST /api/courses", () => {
    it("should create a new course", async () => {
      const courseData = {
        name: "高等数学",
        department: "数学系",
        hours: 4,
        status: "available",
        semester: "2024春季",
      };

      const response = await request(app).post("/api/courses").send(courseData);

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe(courseData.name);
      expect(response.body.department).toBe(courseData.department);
    });
  });
});
