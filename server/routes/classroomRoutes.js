const express = require("express");
const router = express.Router();
const classroomController = require("../controllers/classroomController");

// 获取所有教室
router.get("/", classroomController.getAllClassrooms);

// 创建新教室
router.post("/", classroomController.createClassroom);

// 更新教室信息
router.put("/:id", classroomController.updateClassroom);

// 删除教室
router.delete("/:id", classroomController.deleteClassroom);

module.exports = router;
