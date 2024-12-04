const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const School = require("../models/School");
const Tenant = require("../models/Tenant");
const ScheduleTemplate = require("../models/ScheduleTemplate");

// @desc    初始化基础数据
// @route   POST /api/seed/initialize
// @access  Public
const initializeData = asyncHandler(async (req, res) => {
  // 检查是否已经初始化
  const existingUser = await User.findOne();
  if (existingUser) {
    res.status(400);
    throw new Error("数据已经初始化");
  }

  try {
    // 创建示例租户
    const tenant = await Tenant.create({
      name: "示例学校",
      code: "DEMO",
      status: "active",
      contact: {
        name: "管理员",
        email: "admin@example.com",
        phone: "13800138000",
      },
      subscription: {
        plan: "professional",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // 创建示例学校
    const school = await School.create({
      tenant: tenant._id,
      name: "示例分校",
      code: "DEMO-001",
      status: "active",
      address: "示例地址",
      contact: {
        name: "校长",
        phone: "13800138001",
        email: "principal@example.com",
      },
      settings: {
        academicYear: {
          start: new Date(new Date().getFullYear(), 8, 1),
          end: new Date(new Date().getFullYear() + 1, 6, 31),
        },
        terms: [
          {
            name: "第一学期",
            start: new Date(new Date().getFullYear(), 8, 1),
            end: new Date(new Date().getFullYear() + 1, 1, 15),
          },
          {
            name: "第二学期",
            start: new Date(new Date().getFullYear() + 1, 2, 1),
            end: new Date(new Date().getFullYear() + 1, 6, 31),
          },
        ],
      },
    });

    // 创建默认作息时间模板
    const template = await ScheduleTemplate.create({
      name: "默认作息时间",
      description: "标准作息时间模板",
      tenant: tenant._id,
      school: school._id,
      periods: {
        morning: [
          {
            name: "第一节",
            startTime: "08:00",
            endTime: "08:45",
            creditHours: 1,
          },
          {
            name: "第二节",
            startTime: "08:55",
            endTime: "09:40",
            creditHours: 1,
          },
          {
            name: "第三节",
            startTime: "10:00",
            endTime: "10:45",
            creditHours: 1,
          },
          {
            name: "第四节",
            startTime: "10:55",
            endTime: "11:40",
            creditHours: 1,
          },
        ],
        afternoon: [
          {
            name: "第五节",
            startTime: "14:00",
            endTime: "14:45",
            creditHours: 1,
          },
          {
            name: "第六节",
            startTime: "14:55",
            endTime: "15:40",
            creditHours: 1,
          },
          {
            name: "第七节",
            startTime: "16:00",
            endTime: "16:45",
            creditHours: 1,
          },
          {
            name: "第八节",
            startTime: "16:55",
            endTime: "17:40",
            creditHours: 1,
          },
        ],
        evening: [
          {
            name: "第九节",
            startTime: "19:00",
            endTime: "19:45",
            creditHours: 1,
          },
          {
            name: "第十节",
            startTime: "19:55",
            endTime: "20:40",
            creditHours: 1,
          },
        ],
      },
      isDefault: true,
    });

    // 更新学校的默认作息时间模板
    school.settings.defaultScheduleTemplate = template._id;
    await school.save();

    res.status(201).json({
      message: "基础数据初始化成功",
      data: {
        tenant,
        school,
        template,
      },
    });
  } catch (error) {
    res.status(500);
    throw new Error("初始化失败：" + error.message);
  }
});

module.exports = {
  initializeData,
};
