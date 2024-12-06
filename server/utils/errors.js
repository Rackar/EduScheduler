/**
 * 异步函数错误处理包装器
 * @param {Function} fn - 需要包装的异步函数
 * @returns {Function} 包装后的异步函数
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // 如果存在 next 函数，将错误传递给错误处理中间件
      if (next) {
        next(err);
        return;
      }
      console.log(err);

      // 否则直接返回错误响应
      res.status(err.statusCode || 500).json({
        status: "error",
        message: err.message || "服务器内部错误",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    });
  };
};

module.exports = {
  catchAsync,
};
