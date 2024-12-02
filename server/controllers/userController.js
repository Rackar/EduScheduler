const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
