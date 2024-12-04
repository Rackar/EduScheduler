require("dotenv").config();
const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");
const School = require("../models/School");
const User = require("../models/User");
const ScheduleTemplate = require("../models/ScheduleTemplate");

const cleanData = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("数据库连接成功");

    // 清理租户数据
    const tenantResult = await Tenant.deleteMany({});
    console.log(`已删除 ${tenantResult.deletedCount} 个租户`);

    // 清理学校数据
    const schoolResult = await School.deleteMany({});
    console.log(`已删除 ${schoolResult.deletedCount} 个学校`);

    // // 清理作息时间模板数据
    // const templateResult = await ScheduleTemplate.deleteMany({});
    // console.log(`已删除 ${templateResult.deletedCount} 个作息时间模板`);

    // 清理非超级管理员用户数据
    const userResult = await User.deleteMany({
      roles: { $not: { $all: ["super_admin"] } },
    });
    console.log(`已删除 ${userResult.deletedCount} 个普通用户`);

    // 验证超级管理员是否保留
    const superAdmin = await User.findOne({ roles: "super_admin" });
    if (superAdmin) {
      console.log("超级管理员账号已保留:", {
        username: superAdmin.username,
        name: superAdmin.name,
        email: superAdmin.email,
      });
    } else {
      console.log("警告：未找到超级管理员账号");
    }

    console.log("\n数据清理完成！");
    process.exit(0);
  } catch (error) {
    console.error("数据清理失败：", error);
    process.exit(1);
  }
};

// 运行清理
cleanData();
