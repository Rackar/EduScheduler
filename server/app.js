const express = require("express");
const cors = require("cors");
// 加载环境变量
const path = require("path");

// 根据 NODE_ENV 加载对应的环境变量文件
require("dotenv").config({
  path: path.resolve(
    __dirname,
    `.env.${process.env.NODE_ENV || "development"}`
  ),
});
console.log("当前环境:", process.env.NODE_ENV);
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// 连接数据库
connectDB();

const app = express();

// 基础中间件
app.use(cors());
app.use(
  express.json({
    limit: "50mb",
    type: ["application/json", "text/plain"],
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({ status: "error", message: "无效的 JSON 格式" });
        throw new Error("无效的 JSON 格式");
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

// 设置响应头，确保 UTF-8 编码
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Request Body:", req.body);
  console.log("Request Query:", req.query);
  // console.log("Request Headers:", req.headers);

  // 监听响应完成事件
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} ${
        res.statusCode
      } - ${duration}ms`
    );
  });

  next();
});

// 路由
app.use("/api/tenants", require("./routes/tenantRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/teachers", require("./routes/teacherRoutes"));
app.use("/api/classrooms", require("./routes/classroomRoutes"));
app.use("/api/exchanges", require("./routes/exchangeRoutes"));
app.use("/api/classes", require("./routes/classRoutes"));
app.use("/api/timeslots", require("./routes/timeSlotRoutes"));
const scheduleRoutes2 = require("./routes/scheduleRoutes2");
app.use("/api/schedule2", scheduleRoutes2);
app.use("/api/schedule-templates", require("./routes/scheduleTemplateRoutes"));
app.use("/api/seed", require("./routes/seedRoutes"));

// 注册错误处理中间件（确保在所有路由之后注册）
app.use(errorHandler);

module.exports = app;
