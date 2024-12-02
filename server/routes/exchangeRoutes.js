const express = require("express");
const router = express.Router();
const exchangeController = require("../controllers/exchangeController");

// 创建交换请求
router.post("/", exchangeController.createExchangeRequest);

// 获取所有交换请求
router.get("/", exchangeController.getAllExchangeRequests);

// 获取教师的交换请求
router.get("/teacher", exchangeController.getTeacherExchangeRequests);

// 处理交换请求
router.put("/:id", exchangeController.handleExchangeRequest);

module.exports = router;
