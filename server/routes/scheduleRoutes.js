const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");

// 获取课表
router.get("/", scheduleController.getSchedule);

// 生成课表
router.post("/generate", scheduleController.generateSchedule);

// 调整课表
router.post("/adjust", scheduleController.adjustSchedule);

// 检查时间冲突
router.post("/check-conflicts", scheduleController.checkConflicts);

// 导出课表
router.get("/export", scheduleController.exportSchedule);

module.exports = router;
