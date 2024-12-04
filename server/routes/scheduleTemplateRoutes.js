const express = require("express");
const router = express.Router();
const { protect, schoolAdmin } = require("../middleware/authMiddleware");
const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} = require("../controllers/scheduleTemplateController");

// 获取模板列表
router.get("/", protect, getTemplates);

// 创建新模板
router.post("/", protect, schoolAdmin, createTemplate);

// 获取单个模板
router.get("/:id", protect, getTemplateById);

// 更新模板
router.put("/:id", protect, schoolAdmin, updateTemplate);

// 删除模板
router.delete("/:id", protect, schoolAdmin, deleteTemplate);

// 设置默认模板
router.put("/:id/default", protect, schoolAdmin, setDefaultTemplate);

module.exports = router;
