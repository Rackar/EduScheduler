const Course = require("../models/Course");

// 获取所有课程
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("teacher", "username");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "获取课程失败" });
  }
};

// 创建新课程
exports.createCourse = async (req, res) => {
  const { name, department, hours, semester } = req.body;
  try {
    const newCourse = new Course({ name, department, hours, semester });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ message: "创建课程失败" });
  }
};

// 更新课程信息
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedCourse = await Course.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatedCourse);
  } catch (error) {
    res.status(400).json({ message: "更新课程失败" });
  }
};

// 删除课程
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    await Course.findByIdAndDelete(id);
    res.json({ message: "课程已删除" });
  } catch (error) {
    res.status(500).json({ message: "删除课程失败" });
  }
};
