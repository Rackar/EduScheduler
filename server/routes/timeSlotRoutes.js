const express = require("express");
const router = express.Router();
const timeSlotController = require("../controllers/timeSlotController");

// 获取所有时间段
router.get("/", timeSlotController.getAllTimeSlots);

// 创建新时间段
router.post("/", timeSlotController.createTimeSlot);

// 创建默认时间段
router.post("/create-defaults", timeSlotController.createDefaultTimeSlots);

// 更新时间段
router.put("/:id", timeSlotController.updateTimeSlot);

// 删除时间段
router.delete("/:id", timeSlotController.deleteTimeSlot);

module.exports = router;
