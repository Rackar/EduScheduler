const express = require("express");
const router = express.Router();
const { protect, schoolAdmin } = require("../middleware/authMiddleware");
const Class = require("../models/Class");
const asyncHandler = require("express-async-handler");

// @desc    获取班级列表
// @route   GET /api/classes
// @access  Private
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const classes = await Class.find({
      tenant: req.user.tenant,
      school: req.user.school,
    })
      .populate("courses", "name code")
      .sort("name");
    res.json(classes);
  })
);

// @desc    获取单个班级
// @route   GET /api/classes/:id
// @access  Private
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const classDoc = await Class.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      school: req.user.school,
    }).populate("courses", "name code");

    if (classDoc) {
      res.json(classDoc);
    } else {
      res.status(404);
      throw new Error("班级不存在");
    }
  })
);

// @desc    创建班级
// @route   POST /api/classes
// @access  Private/Admin
router.post(
  "/",
  protect,
  schoolAdmin,
  asyncHandler(async (req, res) => {
    const { name, department, grade, classNumber, studentCount } = req.body;

    const classDoc = await Class.create({
      tenant: req.user.tenant,
      school: req.user.school,
      name,
      department,
      grade,
      classNumber,
      studentCount,
    });

    res.status(201).json(classDoc);
  })
);

// @desc    更新班级
// @route   PUT /api/classes/:id
// @access  Private/Admin
router.put(
  "/:id",
  protect,
  schoolAdmin,
  asyncHandler(async (req, res) => {
    const classDoc = await Class.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      school: req.user.school,
    });

    if (classDoc) {
      classDoc.name = req.body.name || classDoc.name;
      classDoc.department = req.body.department || classDoc.department;
      classDoc.grade = req.body.grade || classDoc.grade;
      classDoc.classNumber = req.body.classNumber || classDoc.classNumber;
      classDoc.studentCount = req.body.studentCount || classDoc.studentCount;
      classDoc.status = req.body.status || classDoc.status;

      const updatedClass = await classDoc.save();
      res.json(updatedClass);
    } else {
      res.status(404);
      throw new Error("班级不存在");
    }
  })
);

// @desc    删除班级
// @route   DELETE /api/classes/:id
// @access  Private/Admin
router.delete(
  "/:id",
  protect,
  schoolAdmin,
  asyncHandler(async (req, res) => {
    const classDoc = await Class.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      school: req.user.school,
    });

    if (classDoc) {
      if (classDoc.courses && classDoc.courses.length > 0) {
        res.status(400);
        throw new Error("该班级还有关联的课程，无法删除");
      }

      await classDoc.deleteOne();
      res.json({ message: "班级已删除" });
    } else {
      res.status(404);
      throw new Error("班级不存在");
    }
  })
);

module.exports = router;
