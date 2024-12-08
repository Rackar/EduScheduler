require("./initDotenv");
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const initSuperAdmin = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("数据库连接成功");

    // 检查是否已存在超级管理员
    const existingSuperAdmin = await User.findOne({
      username: process.env.USERNAME,
    });
    if (existingSuperAdmin) {
      console.log("超级管理员已存在");
      process.exit(0);
    }

    // 设置初始密码
    const initialPassword = process.env.PASSWORD;
    console.log("\n=== 创建超级管理员 ===");
    console.log("初始密码:", initialPassword);

    // 直接创建用户，让 mongoose 中间件处理密码加密
    const superAdmin = await User.create({
      username: process.env.USERNAME,
      password: initialPassword, // 使用明文密码，让中间件处理加密
      name: "超级管理员",
      email: "superadmin@example.com",
      phone: "13800138000",
      roles: ["super_admin"],
      status: "active",
    });

    console.log("\n超级管理员创建成功：");
    console.log({
      username: superAdmin.username,
      name: superAdmin.name,
      email: superAdmin.email,
      phone: superAdmin.phone,
      roles: superAdmin.roles,
    });

    // 验证密码
    const savedUser = await User.findOne({
      username: superAdmin.username,
    }).select("+password");
    console.log("\n=== 验证密码 ===");
    console.log("数据库中的密码哈希:", savedUser.password);
    const verify = await bcrypt.compare(initialPassword, savedUser.password);
    console.log("验证结果:", verify);

    process.exit(0);
  } catch (error) {
    console.error("初始化超级管理员失败：", error);
    process.exit(1);
  }
};

// 运行初始化
initSuperAdmin();
