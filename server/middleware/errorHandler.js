/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.log(err);

  res.status(statusCode).json({
    status: "error",
    message: err.message || "服务器内部错误",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
