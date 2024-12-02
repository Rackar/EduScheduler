const Classroom = require("../models/Classroom");

// 获取所有教室
exports.getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find();
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: "获取教室列表失败" });
  }
};

// 创建新教室
exports.createClassroom = async (req, res) => {
  const { name, capacity, location, resources } = req.body;
  try {
    const newClassroom = new Classroom({ name, capacity, location, resources });
    await newClassroom.save();
    res.status(201).json(newClassroom);
  } catch (error) {
    res.status(400).json({ message: "创建教室失败" });
  }
};

// 更新教室信息
exports.updateClassroom = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedClassroom = await Classroom.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatedClassroom);
  } catch (error) {
    res.status(400).json({ message: "更新教室信息失败" });
  }
};

// 删除教室
exports.deleteClassroom = async (req, res) => {
  const { id } = req.params;
  try {
    await Classroom.findByIdAndDelete(id);
    res.json({ message: "教室已删除" });
  } catch (error) {
    res.status(500).json({ message: "删除教室失败" });
  }
};
