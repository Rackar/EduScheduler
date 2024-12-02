const Class = require("../models/Class");

// 获取所有班级
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("headTeacher", "username")
      .populate("courses.course", "name")
      .populate("courses.classroom", "name");
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "获取班级列表失败" });
  }
};

// 创建新班级
exports.createClass = async (req, res) => {
  try {
    const { name, grade, department, headTeacher, academicYear } = req.body;

    const newClass = new Class({
      name,
      grade,
      department,
      headTeacher,
      academicYear,
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: "创建班级失败", error: error.message });
  }
};

// 更新班级信息
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedClass = await Class.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedClass) {
      return res.status(404).json({ message: "班级不存在" });
    }

    res.json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: "更新班级失败", error: error.message });
  }
};

// 添加学生到班级
exports.addStudentToClass = async (req, res) => {
  try {
    const { classId, studentId } = req.body;

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      {
        $addToSet: { students: studentId },
        $inc: { studentCount: 1 },
      },
      { new: true }
    );

    res.json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: "添加学生失败", error: error.message });
  }
};

// 为班级添加课程
exports.addCourseToClass = async (req, res) => {
  try {
    const { classId, courseId, classroomId, schedule } = req.body;

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      {
        $push: {
          courses: {
            course: courseId,
            classroom: classroomId,
            schedule: schedule,
          },
        },
      },
      { new: true }
    );

    res.json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: "添加课程失败", error: error.message });
  }
};

// 删除班级
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    await Class.findByIdAndDelete(id);
    res.json({ message: "班级已删除" });
  } catch (error) {
    res.status(500).json({ message: "删除班级失败" });
  }
};
