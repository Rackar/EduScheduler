const express = require("express");
const router = express.Router();
const {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getTenantStats,
  updateSubscription,
} = require("../controllers/tenantController");
const {
  protect,
  superAdmin,
  tenantAdmin,
} = require("../middleware/authMiddleware");

// 公开路由
router.post("/", createTenant);

// 需要认证的路由
router.use(protect);

// 超级管理员路由
router.get("/", superAdmin, getTenants);
router.delete("/:id", superAdmin, deleteTenant);
router.put("/:id/subscription", superAdmin, updateSubscription);

// 租户管理员路由
router.get("/:id", tenantAdmin, getTenantById);
router.put("/:id", tenantAdmin, updateTenant);
router.get("/:id/stats", tenantAdmin, getTenantStats);

module.exports = router;
