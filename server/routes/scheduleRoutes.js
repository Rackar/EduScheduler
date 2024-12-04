const express = require("express");
const router = express.Router();
const { protect, schoolAdmin } = require("../middleware/authMiddleware");
const {
  getSchedule,
  generateSchedule,
  adjustSchedule,
  checkConflicts,
  exportSchedule,
} = require("../controllers/scheduleController");

// 所有路由都需要认证
router.use(protect);

// 获取课表
router.get("/", getSchedule);

// 生成课表 (需要学校管理员权限)
router.post("/generate", schoolAdmin, generateSchedule);

// 调整课表 (需要学校管理员权限)
router.put("/adjust", schoolAdmin, adjustSchedule);

// 检查时间冲突
router.post("/check-conflicts", checkConflicts);

// 导出课表
router.get("/export", exportSchedule);

module.exports = router;
