const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");
const { protect, schoolAdmin } = require("../middleware/authMiddleware");

// 需要认证的路由
router.use(protect);

// 获取教师列表
router.get("/", teacherController.getTeachers);

// 获取单个教师
router.get("/:id", teacherController.getTeacherById);

// 创建教师 (需要学校管理员权限)
router.post("/", schoolAdmin, teacherController.createTeacher);

// 更新教师信息 (需要学校管理员权限)
router.put("/:id", schoolAdmin, teacherController.updateTeacher);

// 删除教师 (需要学校管理员权限)
router.delete("/:id", schoolAdmin, teacherController.deleteTeacher);

// 获取教师可用时间
router.get("/:id/availability", teacherController.getTeacherAvailability);

// 更新教师可用时间
router.put("/:id/availability", teacherController.updateTeacherAvailability);

module.exports = router;
