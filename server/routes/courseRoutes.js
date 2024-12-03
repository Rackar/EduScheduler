const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");

// 获取所有课程
router.get("/", courseController.getAllCourses);

// 创建新课程
router.post("/", courseController.createCourse);

// 批量导入课程
router.post("/batch-import", courseController.batchImportCourses);

// 更新课程信息
router.put("/:id", courseController.updateCourse);

// 删除课程
router.delete("/:id", courseController.deleteCourse);

module.exports = router;
