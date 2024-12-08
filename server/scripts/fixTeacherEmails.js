require("./initDotenv");
const mongoose = require("mongoose");
const User = require("../models/User");

const fixTeacherEmails = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("数据库连接成功");

    // 获取所有教师
    const teachers = await User.find({ roles: { $in: ["teacher"] } });
    console.log(`找到 ${teachers.length} 个教师账号`);

    // 修复每个教师的邮箱
    for (const teacher of teachers) {
      const originalEmail = teacher.email;
      const fixedEmail = `${teacher.username}@example.com`;

      if (originalEmail !== fixedEmail) {
        teacher.email = fixedEmail;
        await teacher.save();
        console.log(
          `修复教师 ${teacher.name} 的邮箱：${originalEmail} -> ${fixedEmail}`
        );
      }
    }

    console.log("\n邮箱修复完成！");
    process.exit(0);
  } catch (error) {
    console.error("修复邮箱失败：", error);
    process.exit(1);
  }
};

// 运行修复脚本
fixTeacherEmails();
