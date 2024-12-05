const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// 加载环境变量
dotenv.config();

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
  // console.log("Request Body:", req.body);
  console.log("Request Query:", req.query);
  console.log("Request Headers:", req.headers);

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
app.use("/api/schedules", require("./routes/scheduleRoutes"));
app.use("/api/schedule-templates", require("./routes/scheduleTemplateRoutes"));
app.use("/api/seed", require("./routes/seedRoutes"));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error("Error:", err);
  console.error("Stack:", err.stack);
  res.status(500).json({
    status: "error",
    message: err.message || "服务器错误！",
  });
});

module.exports = app;
