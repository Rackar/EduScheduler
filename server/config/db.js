const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      autoIndex: true,
    });

    // 设置 mongoose 的全局配置
    mongoose.set("toJSON", {
      transform: (doc, ret) => {
        // 确保输出的 JSON 中的中文字符被正确处理
        return ret;
      },
    });

    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
