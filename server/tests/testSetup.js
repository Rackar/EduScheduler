const mongoose = require("mongoose");

// 连接到本地测试数据库
module.exports.connect = async () => {
  const url = "mongodb://127.0.0.1:27017/course_arrangement_test";

  // 检查现有连接
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // 移除已弃用的选项
  await mongoose.connect(url);
};

// 清空数据库集合
module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};

// 关闭数据库连接
module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};
