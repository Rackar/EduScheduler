const path = require("path");
// 根据 NODE_ENV 加载对应的环境变量文件
require("dotenv").config({
  path: path.resolve(
    __dirname,
    "../",
    `.env.${process.env.NODE_ENV || "development"}`
  ),
});
console.log("当前环境:", process.env.NODE_ENV);
