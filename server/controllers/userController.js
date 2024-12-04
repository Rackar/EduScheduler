const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");

// 用户注册
exports.registerUser = async (req, res) => {
  try {
    const { username, password, role, department } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "用户名已存在" });
    }

    // 创建新用户
    const user = await User.create({
      username,
      password,
      role,
      department,
      teachingHours:
        role === "teacher" ? { current: 0, min: 14, max: 16 } : undefined,
    });

    // 生成 token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      department: user.department,
      token,
    });
  } catch (error) {
    res.status(400).json({ message: "用户创建失败", error: error.message });
  }
};

// 用户登录
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      department: user.department,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "登录失败", error: error.message });
  }
};

// 获取教师列表
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .select("-password")
      .populate("courses");
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "获取教师列表失败" });
  }
};

// 更新用户信息
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 如果更新包含密码，需要重新加密
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: "更新用户信息失败", error: error.message });
  }
};

// @desc    用户登录
// @route   POST /api/users/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  console.log("\n=== 登录请求开始 ===");
  console.log("用户名:", username);
  console.log("密码:", password);

  // 查找用户
  const user = await User.findOne({ username })
    .select("+password")
    .populate({
      path: "tenant",
      select: "name code status",
      options: { required: false },
    })
    .populate({
      path: "school",
      select: "name code status",
      options: { required: false },
    });

  console.log("\n=== 数据库查询结果 ===");
  console.log("找到用户:", !!user);
  if (user) {
    console.log("用户ID:", user._id);
    console.log("用户角色:", user.roles);
    console.log("密码字段是否存在:", !!user.password);
    console.log("密码哈希:", user.password);

    // 验证密码
    console.log("\n=== 开始密码验证 ===");
    const isMatch = await user.matchPassword(password);
    console.log("最终密码匹配结果:", isMatch);

    if (isMatch) {
      // 检查用户状态
      if (user.status === "inactive") {
        console.log("用户状态检查失败: 用户已停用");
        res.status(403);
        throw new Error("用户已停用");
      }

      // 如果不是超级管理员，检查租户状态
      if (
        !user.roles.includes("super_admin") &&
        user.tenant?.status === "inactive"
      ) {
        console.log("租户状态检查失败: 租户已停用");
        res.status(403);
        throw new Error("租户已停用");
      }

      // 生成 JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      // 更新最后登录时间
      user.lastLogin = new Date();
      await user.save();

      // 返回用户信息
      res.json({
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          roles: user.roles,
          tenant: user.tenant,
          school: user.school,
          status: user.status,
          lastLogin: user.lastLogin,
        },
      });
    } else {
      console.log("密码验证失败");
      res.status(401);
      throw new Error("用户名或密码错误");
    }
  } else {
    console.log("未找到用户");
    res.status(401);
    throw new Error("用户名或密码错误");
  }
});

// @desc    获取当前用户信息
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("tenant", "name code status")
    .populate("school", "name code status");

  if (user) {
    res.json({
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      tenant: user.tenant,
      school: user.school,
      status: user.status,
      lastLogin: user.lastLogin,
    });
  } else {
    res.status(404);
    throw new Error("用户不存在");
  }
});

// @desc    更新用户信息
// @route   PUT /api/users/me
// @access  Private
const updateCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // 更新基本信息
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.avatar = req.body.avatar || user.avatar;

    // 更新个人资料
    if (req.body.profile) {
      user.profile = {
        ...user.profile,
        ...req.body.profile,
      };
    }

    // 更新偏好设置
    if (req.body.preferences) {
      user.preferences = {
        ...user.preferences,
        ...req.body.preferences,
      };
    }

    // 如果提供了新密码
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
      roles: updatedUser.roles,
      tenant: updatedUser.tenant,
      school: updatedUser.school,
      status: updatedUser.status,
      profile: updatedUser.profile,
      preferences: updatedUser.preferences,
      lastLogin: updatedUser.lastLogin,
    });
  } else {
    res.status(404);
    throw new Error("用户不存在");
  }
});

// @desc    修改密码
// @route   PUT /api/users/me/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (user && (await user.matchPassword(currentPassword))) {
    user.password = newPassword;
    await user.save();
    res.json({ message: "密码修改成功" });
  } else {
    res.status(401);
    throw new Error("当前密码错误");
  }
});

module.exports = {
  login,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
};
