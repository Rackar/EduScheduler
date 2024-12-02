const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// 用户注册
router.post("/register", userController.registerUser);

// 用户登录
router.post("/login", userController.loginUser);

// 获取教师列表
router.get("/teachers", userController.getTeachers);

// 更新用户信息
router.put("/:id", userController.updateUser);

module.exports = router;
