const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// @desc    获取教师列表（分页）
// @route   GET /api/teachers
// @access  Private
exports.getTeachers = asyncHandler(async (req, res) => {
  const { page = 1, size = 10, query = "", department = "" } = req.query;

  const filter = {
    tenant: req.user.tenant,
    school: req.user.school,
    roles: { $in: ["teacher"] },
  };

  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ];
  }

  if (department) {
    filter["profile.department"] = department;
  }

  const [teachers, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .populate("profile.courses", "name code")
      .skip((page - 1) * size)
      .limit(parseInt(size))
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  // 转换教师数据，确保正确处理 ObjectId
  const transformedTeachers = teachers.map((teacher) => {
    const teacherObj = teacher.toObject();
    return {
      ...teacherObj,
      id: teacherObj._id.toString(),
      _id: undefined,
      tenant: teacherObj.tenant?.toString(),
      school: teacherObj.school?.toString(),
      profile: {
        ...teacherObj.profile,
        courses: teacherObj.profile?.courses?.map((course) => ({
          ...course,
          id: course._id.toString(),
          _id: undefined,
        })),
      },
    };
  });

  res.json({
    items: transformedTeachers,
    total,
    page: parseInt(page),
    size: parseInt(size),
  });
});

// @desc    获取所有教师（不分页）
// @route   GET /api/teachers/all
// @access  Private
exports.getAllTeachers = asyncHandler(async (req, res) => {
  const filter = {
    tenant: req.user.tenant,
    school: req.user.school,
    roles: { $in: ["teacher"] },
  };

  const teachers = await User.find(filter)
    .select("-password")
    .populate("profile.courses", "name code")
    .sort({ name: 1 });

  // 转换教师数据，确保正确处理 ObjectId
  const transformedTeachers = teachers.map((teacher) => {
    const teacherObj = teacher.toObject();
    return {
      ...teacherObj,
      id: teacherObj._id.toString(),
      _id: undefined,
      tenant: teacherObj.tenant?.toString(),
      school: teacherObj.school?.toString(),
      profile: {
        ...teacherObj.profile,
        courses: teacherObj.profile?.courses?.map((course) => ({
          ...course,
          id: course._id.toString(),
          _id: undefined,
        })),
      },
    };
  });

  res.json(transformedTeachers);
});

// @desc    获取单个教师
// @route   GET /api/teachers/:id
// @access  Private
exports.getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    school: req.user.school,
    roles: { $in: ["teacher"] },
  })
    .select("-password")
    .populate("profile.courses", "name code");

  if (teacher) {
    res.json(teacher);
  } else {
    res.status(404);
    throw new Error("教师不存在");
  }
});

// @desc    创建教师
// @route   POST /api/teachers
// @access  Private/Admin
exports.createTeacher = asyncHandler(async (req, res) => {
  const { username, name, email, phone, department, title } = req.body;

  // 检查用户名是否已存在
  const existingUser = await User.findOne({
    tenant: req.user.tenant,
    school: req.user.school,
    username,
  });

  if (existingUser) {
    res.status(400);
    throw new Error("用户名已存在");
  }

  // 生成标准化的邮箱
  const standardEmail = email || `${username}@example.com`;

  const teacher = await User.create({
    tenant: req.user.tenant,
    school: req.user.school,
    username,
    name,
    email: standardEmail,
    phone,
    password: "123456", // 默认密码
    roles: ["teacher"],
    profile: {
      department,
      title,
      teachingHours: {
        current: 0,
        min: 14,
        max: 16,
      },
    },
  });

  res.status(201).json({
    message: "创建教师成功",
    data: {
      ...teacher.toObject(),
      password: undefined,
    },
  });
});

// @desc    更新教师信息
// @route   PUT /api/teachers/:id
// @access  Private/Admin
exports.updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    school: req.user.school,
    roles: { $in: ["teacher"] },
  });

  if (!teacher) {
    res.status(404);
    throw new Error("教师不存在");
  }

  const { username, name, email, phone, department, title } = req.body;

  // 如果修改了用户名，检查是否已存在
  if (username !== teacher.username) {
    const existingUser = await User.findOne({
      tenant: req.user.tenant,
      school: req.user.school,
      username,
      _id: { $ne: teacher._id },
    });

    if (existingUser) {
      res.status(400);
      throw new Error("用户名已存在");
    }
  }

  teacher.username = username;
  teacher.name = name;
  teacher.email = email;
  teacher.phone = phone;
  teacher.profile.department = department;
  teacher.profile.title = title;

  const updatedTeacher = await teacher.save();

  res.json({
    message: "更新教师信息成功",
    data: {
      ...updatedTeacher.toObject(),
      password: undefined,
    },
  });
});

// @desc    删除教师
// @route   DELETE /api/teachers/:id
// @access  Private/Admin
exports.deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    school: req.user.school,
    roles: { $in: ["teacher"] },
  });

  if (!teacher) {
    res.status(404);
    throw new Error("教师不存在");
  }

  // 检查教师是否有关联的课程
  if (teacher.profile.courses && teacher.profile.courses.length > 0) {
    res.status(400);
    throw new Error("该教师还有关联的课程，无法删除");
  }

  await teacher.deleteOne();

  res.json({
    message: "删除教师成功",
    data: teacher._id,
  });
});

// @desc    获取教师可用时间
// @route   GET /api/teachers/:id/availability
// @access  Private
exports.getTeacherAvailability = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    school: req.user.school,
    roles: { $in: ["teacher"] },
  }).select("profile.availability");

  if (!teacher) {
    res.status(404);
    throw new Error("教师不存在");
  }

  res.json(teacher.profile.availability || {});
});

// @desc    更新教师可用时间
// @route   PUT /api/teachers/:id/availability
// @access  Private
exports.updateTeacherAvailability = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
    school: req.user.school,
    roles: { $in: ["teacher"] },
  });

  if (!teacher) {
    res.status(404);
    throw new Error("教师不存在");
  }

  teacher.profile.availability = req.body;
  await teacher.save();

  res.json({
    message: "更新教师可用时间成功",
    data: teacher.profile.availability,
  });
});
