const express = require("express");
const router = express.Router();
const {
  login,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// 公开路由
router.post("/login", login);

// 需要认证的路由
router.use(protect);
router.get("/me", getCurrentUser);
router.put("/me", updateCurrentUser);
router.put("/me/password", changePassword);

module.exports = router;
