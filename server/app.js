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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Request Body:", req.body);
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
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/classrooms", require("./routes/classroomRoutes"));
app.use("/api/exchanges", require("./routes/exchangeRoutes"));
app.use("/api/classes", require("./routes/classRoutes"));
app.use("/api/timeslots", require("./routes/timeSlotRoutes"));
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
