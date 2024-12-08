const mongoose = require("mongoose");
require("./initDotenv");

// 导入所有模型
const User = require("../models/User");
const Course = require("../models/Course");
const Class = require("../models/Class");
const Schedule = require("../models/Schedule");
const Classroom = require("../models/Classroom");

async function clearDatabase() {
  try {
    console.log("正在连接数据库...");

    // 设置连接选项
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 超时时间设置为5秒
      socketTimeoutMS: 45000, // Socket超时
    };

    // 连接数据库
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/course_arrangement",
      options
    );
    console.log("数据库连接成功！");

    console.log("开始清理数据库...");

    // 清空所有集合
    const results = await Promise.all([
      Classroom.deleteMany({}),
      Course.deleteMany({}),
      Class.deleteMany({}),
      Schedule.deleteMany({}),
      // 删除角色中有teacher的user
      User.deleteMany({
        roles: { $in: ["teacher"] },
      }),
    ]);

    console.log("清理结果:");
    console.log("Classrooms deleted:", results[0].deletedCount);
    console.log("Courses deleted:", results[1].deletedCount);
    console.log("Classes deleted:", results[2].deletedCount);
    console.log("Schedules deleted:", results[3].deletedCount);
    console.log("Teachers deleted:", results[4].deletedCount);
    console.log("\n数据库清理完成！");
  } catch (error) {
    console.error("清理数据库时出错:", error);
  } finally {
    try {
      await mongoose.connection.close();
      console.log("数据库连接已关闭");
    } catch (error) {
      console.error("关闭数据库连接时出错:", error);
    }
    process.exit(0);
  }
}

// 处理未捕获的Promise错误
process.on("unhandledRejection", (error) => {
  console.error("未捕获的Promise错误:", error);
  process.exit(1);
});

// 执行清理
clearDatabase();
