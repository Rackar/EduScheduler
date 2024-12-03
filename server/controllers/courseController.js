const Course = require("../models/Course");

// 获取所有课程
exports.getAllCourses = async (req, res) => {
  try {
    const { page = 1, size = 10, query = "" } = req.query;
    const skip = (page - 1) * size;

    const filter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { code: { $regex: query, $options: "i" } },
            { department: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("teacher", "username")
        .skip(skip)
        .limit(parseInt(size))
        .sort({ createdAt: -1 }),
      Course.countDocuments(filter),
    ]);

    res.json({
      items: courses,
      total,
      page: parseInt(page),
      size: parseInt(size),
    });
  } catch (error) {
    console.error("获取课程列表失败:", error);
    res.status(500).json({ message: "获取课程列表失败" });
  }
};

// 创建新课程
exports.createCourse = async (req, res) => {
  try {
    const courseData = {
      name: req.body.name,
      code: req.body.code,
      credit: req.body.credit,
      hours: req.body.hours,
      type: req.body.type,
      department: req.body.department,
      description: req.body.description,
    };

    const newCourse = new Course(courseData);
    await newCourse.save();

    res.status(201).json({
      message: "创建课程成功",
      data: newCourse,
    });
  } catch (error) {
    console.error("创建课程失败:", error);
    res.status(400).json({
      message: "创建课程失败",
      error: error.message,
    });
  }
};

// 更新课程信息
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      name: req.body.name,
      code: req.body.code,
      credit: req.body.credit,
      hours: req.body.hours,
      type: req.body.type,
      department: req.body.department,
      description: req.body.description,
    };

    const updatedCourse = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({ message: "课程不存在" });
    }

    res.json({
      message: "更新课程成功",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("更新课程失败:", error);
    res.status(400).json({
      message: "更新课程失败",
      error: error.message,
    });
  }
};

// 删除课程
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({ message: "课程不存在" });
    }

    res.json({
      message: "课程已删除",
      data: course,
    });
  } catch (error) {
    console.error("删除课程失败:", error);
    res.status(500).json({
      message: "删除课程失败",
      error: error.message,
    });
  }
};
