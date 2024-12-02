const mongoose = require("mongoose");

async function testConnection() {
  try {
    // 尝试连接数据库
    await mongoose.connect(
      "mongodb://127.0.0.1:27017/course_arrangement_test",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("MongoDB连接成功！");
    console.log("连接状态:", mongoose.connection.readyState);
    console.log("数据库名称:", mongoose.connection.name);
    console.log("数据库主机:", mongoose.connection.host);
    console.log("数据库端口:", mongoose.connection.port);

    // 列出所有数据库
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log("\n可用的数据库列表:");
    dbs.databases.forEach((db) => {
      console.log(`- ${db.name}`);
    });
  } catch (error) {
    console.error("MongoDB连接失败:", error);
  } finally {
    // 关闭连接
    await mongoose.connection.close();
    console.log("\n数据库连接已关闭");
  }
}

testConnection();
