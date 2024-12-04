const Class = require("../models/Class");
const asyncHandler = require("express-async-handler");

// 获取班级列表
exports.getClasses = asyncHandler(async (req, res) => {
  const { page = 1, size = 10, query = "", grade, department } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(size);
  const limit = parseInt(size);

  // 构建查询条件
  const filter = {
    tenant: req.user.tenant,
    school: req.user.school,
  };

  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { department: { $regex: query, $options: "i" } },
    ];
  }

  if (grade) {
    filter.grade = parseInt(grade);
  }

  if (department) {
    filter.department = department;
  }

  try {
    // 查询总数
    const total = await Class.countDocuments(filter);

    // 查询分页数据
    const items = await Class.find(filter)
      .populate("courses", "name code credit hours type weeks")
      .sort({ grade: -1, department: 1, classNumber: 1 })
      .skip(skip)
      .limit(limit);

    res.json({ items, total });
  } catch (error) {
    res.status(500);
    throw new Error("获取班级列表失败");
  }
});

// 获取单个班级详情
exports.getClass = asyncHandler(async (req, res) => {
  const classData = await Class.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    school: req.user.school,
  }).populate("courses", "name code credit hours type weeks");

  if (!classData) {
    res.status(404);
    throw new Error("班级不存在");
  }

  res.json(classData);
});

// 创建班级
exports.createClass = asyncHandler(async (req, res) => {
  const { name, department, grade, classNumber, studentCount } = req.body;

  // 检查是否存在相同的班级
  const existingClass = await Class.findOne({
    tenant: req.user.tenant,
    school: req.user.school,
    department,
    grade,
    classNumber,
  });

  if (existingClass) {
    res.status(400);
    throw new Error("该班级已存在");
  }

  const newClass = await Class.create({
    tenant: req.user.tenant,
    school: req.user.school,
    name,
    department,
    grade,
    classNumber,
    studentCount,
  });

  res.status(201).json(newClass);
});

// 更新班级
exports.updateClass = asyncHandler(async (req, res) => {
  const { name, department, grade, classNumber, studentCount } = req.body;

  const classData = await Class.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    school: req.user.school,
  });

  if (!classData) {
    res.status(404);
    throw new Error("班级不存在");
  }

  // 检查是否存在相同的班级（排除当前班级）
  const existingClass = await Class.findOne({
    tenant: req.user.tenant,
    school: req.user.school,
    department,
    grade,
    classNumber,
    _id: { $ne: req.params.id },
  });

  if (existingClass) {
    res.status(400);
    throw new Error("该班级已存在");
  }

  classData.name = name;
  classData.department = department;
  classData.grade = grade;
  classData.classNumber = classNumber;
  classData.studentCount = studentCount;

  const updatedClass = await classData.save();
  res.json(updatedClass);
});

// 删除班级
exports.deleteClass = asyncHandler(async (req, res) => {
  const classData = await Class.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    school: req.user.school,
  }).populate("courses");

  if (!classData) {
    res.status(404);
    throw new Error("班级不存在");
  }

  if (classData.courses?.length > 0) {
    res.status(400);
    throw new Error("该班级还有关联的课程，无法删除");
  }

  await classData.deleteOne();
  res.json({ message: "删除成功" });
});
