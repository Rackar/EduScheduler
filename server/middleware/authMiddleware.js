const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// 保护路由中间件
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 获取token
      token = req.headers.authorization.split(" ")[1];

      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 获取用户信息（不包含密码）
      req.user = await User.findById(decoded.id)
        .select("-password")
        .populate("tenant", "code name status")
        .populate("school", "code name status");

      // 检查租户和用户状态
      if (req.user.tenant && req.user.tenant.status !== "active") {
        res.status(403);
        throw new Error("租户已停用");
      }

      if (req.user.status !== "active") {
        res.status(403);
        throw new Error("用户已停用");
      }

      // 更新最后登录时间
      await User.findByIdAndUpdate(req.user._id, {
        lastLogin: new Date(),
      });

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("未授权，token无效");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("未授权，没有token");
  }
});

// 超级管理员权限中间件
const superAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && !req.user.tenant) {
    next();
  } else {
    res.status(403);
    throw new Error("需要超级管理员权限");
  }
});

// 租户管理员权限中间件
const tenantAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isTenantAdmin()) {
    next();
  } else {
    res.status(403);
    throw new Error("需要租户管理员权限");
  }
});

// 学校管理员权限中间件
const schoolAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.isTenantAdmin() || req.user.isSchoolAdmin())) {
    next();
  } else {
    res.status(403);
    throw new Error("需要学校管理员权限");
  }
});

// 排课管理员权限中间件
const scheduler = asyncHandler(async (req, res, next) => {
  if (
    req.user &&
    (req.user.isTenantAdmin() ||
      req.user.isSchoolAdmin() ||
      req.user.isScheduler())
  ) {
    next();
  } else {
    res.status(403);
    throw new Error("需要排课管理员权限");
  }
});

// 教师权限中间件
const teacher = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isTeacher()) {
    next();
  } else {
    res.status(403);
    throw new Error("需要教师权限");
  }
});

// 学生权限中间件
const student = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isStudent()) {
    next();
  } else {
    res.status(403);
    throw new Error("需要学生权限");
  }
});

module.exports = {
  protect,
  superAdmin,
  tenantAdmin,
  schoolAdmin,
  scheduler,
  teacher,
  student,
};
