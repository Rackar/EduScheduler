const asyncHandler = require("express-async-handler");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const School = require("../models/School");
const {
  initializeTenant,
  generateDefaultPassword,
} = require("../services/tenantService");

// @desc    创建新租户
// @route   POST /api/tenants
// @access  Public
const createTenant = asyncHandler(async (req, res) => {
  const { tenant: tenantData, admin: adminData, school: schoolData } = req.body;

  // 检查租户代码是否已存在
  const existingTenant = await Tenant.findOne({ code: tenantData.code });
  if (existingTenant) {
    res.status(400);
    throw new Error("租户代码已存在");
  }

  // 检查管理员用户名是否已存在
  const existingAdmin = await User.findOne({ username: adminData.username });
  if (existingAdmin) {
    res.status(400);
    throw new Error("管理员用户名已存在");
  }

  // 如果没有提供密码，生成默认密码
  if (!adminData.password) {
    adminData.password = generateDefaultPassword(adminData.username);
  }

  try {
    // 初始化租户
    const result = await initializeTenant(tenantData, adminData, schoolData);

    // 构造响应数据
    const responseData = {
      message: "租户创建成功",
      data: {
        tenant: {
          id: result.tenant._id.toString(),
          name: Buffer.from(result.tenant.name).toString(),
          code: result.tenant.code,
        },
        admin: {
          username: result.admin.username,
          password: adminData.password, // 仅在创建时返回密码
        },
        school: {
          id: result.school._id.toString(),
          name: Buffer.from(result.school.name).toString(),
          code: result.school.code,
        },
      },
    };

    // 设置响应头
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    // 发送响应
    res.status(201).json(responseData);
  } catch (error) {
    res.status(500);
    throw new Error("租户创建失败：" + error.message);
  }
});

// @desc    获取所有租户
// @route   GET /api/tenants
// @access  Private/SuperAdmin
const getTenants = asyncHandler(async (req, res) => {
  const tenants = await Tenant.find({});

  // 处理中文编码
  const processedTenants = tenants.map((tenant) => {
    const processedTenant = tenant.toObject();
    if (Buffer.isBuffer(tenant.name)) {
      processedTenant.name = Buffer.from(tenant.name).toString();
    }
    if (Buffer.isBuffer(tenant.contact?.name)) {
      processedTenant.contact.name = Buffer.from(
        tenant.contact.name
      ).toString();
    }
    return processedTenant;
  });

  res.json(processedTenants);
});

// @desc    获取租户详情
// @route   GET /api/tenants/:id
// @access  Private/TenantAdmin
const getTenantById = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (tenant) {
    // 检查权限
    if (req.user.tenant.toString() !== tenant._id.toString()) {
      res.status(403);
      throw new Error("没有权限访问此租户信息");
    }
    res.json(tenant);
  } else {
    res.status(404);
    throw new Error("租户不存在");
  }
});

// @desc    更新租户信息
// @route   PUT /api/tenants/:id
// @access  Private/TenantAdmin
const updateTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (tenant) {
    // 检查权限
    if (req.user.tenant.toString() !== tenant._id.toString()) {
      res.status(403);
      throw new Error("没有权限修改此租户信息");
    }

    // 更新基本信息
    tenant.name = req.body.name || tenant.name;
    tenant.contact = req.body.contact || tenant.contact;
    tenant.settings = req.body.settings || tenant.settings;

    // 如果是超级管理员，允许更新更多信息
    if (req.user.isSuperAdmin) {
      tenant.status = req.body.status || tenant.status;
      tenant.subscription = req.body.subscription || tenant.subscription;
    }

    const updatedTenant = await tenant.save();
    res.json(updatedTenant);
  } else {
    res.status(404);
    throw new Error("租户不存在");
  }
});

// @desc    删除租户
// @route   DELETE /api/tenants/:id
// @access  Private/SuperAdmin
const deleteTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (tenant) {
    // 检查是否有关联的学校
    const schoolCount = await School.countDocuments({ tenant: tenant._id });
    if (schoolCount > 0) {
      res.status(400);
      throw new Error("无法删除：租户下还有学校");
    }

    // 检查是否有关联的用户
    const userCount = await User.countDocuments({ tenant: tenant._id });
    if (userCount > 0) {
      res.status(400);
      throw new Error("无法删除：租户下还有用户");
    }

    await tenant.deleteOne();
    res.json({ message: "租户已删除" });
  } else {
    res.status(404);
    throw new Error("租户不存在");
  }
});

// @desc    获取租户统计信息
// @route   GET /api/tenants/:id/stats
// @access  Private/TenantAdmin
const getTenantStats = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (tenant) {
    // 检查权限
    if (req.user.tenant.toString() !== tenant._id.toString()) {
      res.status(403);
      throw new Error("没有权限访问此租户信息");
    }

    // 获取统计信息
    const stats = {
      schoolCount: await School.countDocuments({ tenant: tenant._id }),
      userCount: await User.countDocuments({ tenant: tenant._id }),
      usersByRole: await User.aggregate([
        { $match: { tenant: tenant._id } },
        { $unwind: "$roles" },
        {
          $group: {
            _id: "$roles",
            count: { $sum: 1 },
          },
        },
      ]),
      activeSchools: await School.countDocuments({
        tenant: tenant._id,
        status: "active",
      }),
      activeUsers: await User.countDocuments({
        tenant: tenant._id,
        status: "active",
      }),
    };

    res.json(stats);
  } else {
    res.status(404);
    throw new Error("租户不存在");
  }
});

// @desc    更新租户订阅信息
// @route   PUT /api/tenants/:id/subscription
// @access  Private/SuperAdmin
const updateSubscription = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (tenant) {
    const { plan, startDate, endDate } = req.body;

    tenant.subscription = {
      plan,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    // 根据订阅计划更新设置
    switch (plan) {
      case "basic":
        tenant.settings.maxUsers = 100;
        tenant.settings.maxSchools = 1;
        tenant.settings.features = {
          multipleSchools: false,
          advancedReports: false,
          api: false,
        };
        break;
      case "professional":
        tenant.settings.maxUsers = 500;
        tenant.settings.maxSchools = 5;
        tenant.settings.features = {
          multipleSchools: true,
          advancedReports: true,
          api: false,
        };
        break;
      case "enterprise":
        tenant.settings.maxUsers = 1000;
        tenant.settings.maxSchools = 10;
        tenant.settings.features = {
          multipleSchools: true,
          advancedReports: true,
          api: true,
        };
        break;
    }

    const updatedTenant = await tenant.save();
    res.json(updatedTenant);
  } else {
    res.status(404);
    throw new Error("租户不存在");
  }
});

module.exports = {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getTenantStats,
  updateSubscription,
};
