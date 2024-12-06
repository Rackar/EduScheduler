const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController2");
const { protect, schoolAdmin } = require("../middleware/authMiddleware");

// 所有路由都需要登录
router.use(protect);

// 生成课表 - 仅管理员
router.post("/generate", schoolAdmin, scheduleController.generateSchedule);

// 获取课表列表
router.get("/", scheduleController.getSchedules);

// 获取周课表
router.get("/week", scheduleController.getWeekSchedule);

// 更新课表状态 - 仅管理员
router.patch(
  "/:id/status",
  schoolAdmin,
  scheduleController.updateScheduleStatus
);

// 批量更新状态 - 仅管理员
router.patch(
  "/batch/status",
  schoolAdmin,
  scheduleController.batchUpdateStatus
);

// 删除课表 - 仅管理员
router.delete("/:id", schoolAdmin, scheduleController.deleteSchedule);

// 批量删除 - 仅管理员
router.delete("/batch", schoolAdmin, scheduleController.batchDelete);

module.exports = router;
