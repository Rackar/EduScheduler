require("dotenv").config();
const mongoose = require("mongoose");
const Schedule = require("../models/Schedule");

const clearSchedule = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("数据库连接成功");

    // 查询现有课表数据
    const count = await Schedule.countDocuments();
    console.log(`当前课表数据数量: ${count}`);

    // 清理课表数据
    const result = await Schedule.deleteMany({});
    console.log(`已删除 ${result.deletedCount} 条课表数据`);

    process.exit(0);
  } catch (error) {
    console.error("清理课表数据失败：", error);
    process.exit(1);
  }
};

// 运行清理
clearSchedule();
