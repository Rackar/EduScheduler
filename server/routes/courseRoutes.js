const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { protect, schoolAdmin } = require("../middleware/authMiddleware");

// 需要认证的路由
router.use(protect);

// 获取所有课程
router.get("/", courseController.getAllCourses);

// 创建新课程 (需要学校管理员权限)
router.post("/", schoolAdmin, courseController.createCourse);

// 批量导入课程 (需要学校管理员权限)
router.post("/batch-import", schoolAdmin, courseController.batchImportCourses);

// 更新课程信息 (需要学校管理员权限)
router.put("/:id", schoolAdmin, courseController.updateCourse);

// 删除课程 (需要学校管理员权限)
router.delete("/:id", schoolAdmin, courseController.deleteCourse);

// 清除所有数据
router.post("/clear-all", protect, courseController.clearAllData);

module.exports = router;
