const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController2");
const { protect } = require("../middleware/authMiddleware");

// 所有路由都需要登录
router.use(protect);

// 生成课表 - 仅管理员
router.post("/generate", scheduleController.generateSchedule);

// 获取班级某周的排课结果
router.get("/class", scheduleController.getScheduleByClassAndWeek);

// 获取教师某周的排课结果
router.get("/teacher", scheduleController.getScheduleByTeacherAndWeek);

// 获取班级全部课程安排
router.get("/class/full", scheduleController.getClassScheduleFull);

// 获取教师全部课程安排
router.get("/teacher/full", scheduleController.getTeacherScheduleFull);

// 检查课程时间冲突
router.post("/check-conflicts", scheduleController.checkScheduleConflicts);

// 更新课程时间
router.put("/update-time", scheduleController.updateScheduleTime);

// 获取统计数据
router.get("/statistics", scheduleController.getStatistics);

// 优化课表分布
router.post("/optimize", scheduleController.optimizeSchedule);

// 清除排课
router.post("/clear", protect, scheduleController.clearSchedule);

module.exports = router;
