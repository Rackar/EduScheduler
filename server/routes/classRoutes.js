const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");

// 获取所有班级
router.get("/", classController.getAllClasses);

// 创建新班级
router.post("/", classController.createClass);

// 更新班级信息
router.put("/:id", classController.updateClass);

// 添加学生到班级
router.post("/add-student", classController.addStudentToClass);

// 为班级添加课程
router.post("/add-course", classController.addCourseToClass);

// 删除班级
router.delete("/:id", classController.deleteClass);

module.exports = router;
