const express = require("express");
const router = express.Router();
const scheduleTemplateController = require("../controllers/scheduleTemplateController");
const { protect, schoolAdmin } = require("../middleware/authMiddleware");

// 使用认证中间件保护所有路由
router.use(protect);

// 获取所有模板
router.get("/", scheduleTemplateController.getTemplates);

// 获取单个模板
router.get("/:id", scheduleTemplateController.getTemplate);

// 创建新模板 (需要学校管理员权限)
router.post("/", schoolAdmin, scheduleTemplateController.createTemplate);

// 更新模板 (需要学校管理员权限)
router.put("/:id", schoolAdmin, scheduleTemplateController.updateTemplate);

// 删除模板 (需要学校管理员权限)
router.delete("/:id", schoolAdmin, scheduleTemplateController.deleteTemplate);

// 设置当前模板 (需要学校管理员权限)
router.post(
  "/:id/set-active",
  schoolAdmin,
  scheduleTemplateController.setActiveTemplate
);

// 获取当前活动模板
router.get("/active/current", scheduleTemplateController.getCurrentTemplate);

module.exports = router;
