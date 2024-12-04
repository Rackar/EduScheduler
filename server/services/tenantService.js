const bcrypt = require("bcryptjs");
const Tenant = require("../models/Tenant");
const School = require("../models/School");
const User = require("../models/User");
const ScheduleTemplate = require("../models/ScheduleTemplate");

/**
 * 初始化租户
 * @param {Object} tenantData 租户数据
 * @param {Object} adminData 管理员数据
 * @param {Object} schoolData 学校数据
 */
const initializeTenant = async (tenantData, adminData, schoolData) => {
  let tenant, school, template, admin;

  try {
    console.log("=== 开始创建租户 ===");
    // 1. 创建租户
    tenant = await Tenant.create({
      ...tenantData,
      status: "active",
      subscription: {
        plan: "basic",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天试用期
      },
    });
    console.log("租户创建成功:", tenant._id);

    console.log("=== 开始创建学校 ===");
    // 2. 创建默认学校
    school = await School.create({
      ...schoolData,
      tenant: tenant._id,
      status: "active",
      settings: {
        academicYear: {
          start: new Date(new Date().getFullYear(), 8, 1), // 9月1日
          end: new Date(new Date().getFullYear() + 1, 6, 31), // 次年7月31日
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
    console.log("学校创建成功:", school._id);

    console.log("=== 开始创建管理员 ===");
    // 3. 创建租户管理员
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    console.log("管理员数据:", {
      ...adminData,
      password: "[已加密]",
      tenant: tenant._id,
      school: school._id,
      roles: ["tenant_admin", "school_admin"],
    });

    admin = await User.create({
      ...adminData,
      password: hashedPassword,
      tenant: tenant._id,
      school: school._id,
      roles: ["tenant_admin", "school_admin"],
      status: "active",
    });
    console.log("管理员创建成功:", admin._id);

    console.log("=== 开始创建作息时间模板 ===");
    // 4. 创建默认作息时间模板
    template = await ScheduleTemplate.create({
      name: `${school.code}-默认作息时间`,
      description: "标准作息时间模板",
      tenant: tenant._id,
      school: school._id,
      createdBy: admin._id,
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
    console.log("作息时间模板创建成功:", template._id);

    console.log("=== 开始更新学校设置 ===");
    // 5. 更新学校的默认作息时间模板
    school.settings.defaultScheduleTemplate = template._id;
    await school.save();
    console.log("学校设置更新成功");

    return {
      tenant,
      school,
      admin,
      template,
    };
  } catch (error) {
    console.error("创建失败:", error);
    // 如果出错，尝试清理已创建的数据
    const cleanup = async () => {
      if (tenant?._id) {
        console.log("清理租户:", tenant._id);
        await Tenant.findByIdAndDelete(tenant._id);
      }
      if (school?._id) {
        console.log("清理学校:", school._id);
        await School.findByIdAndDelete(school._id);
      }
      if (admin?._id) {
        console.log("清理管理员:", admin._id);
        await User.findByIdAndDelete(admin._id);
      }
      if (template?._id) {
        console.log("清理作息时间模板:", template._id);
        await ScheduleTemplate.findByIdAndDelete(template._id);
      }
    };

    await cleanup();
    throw error;
  }
};

/**
 * 生成默认密码
 * @param {string} username 用户名
 * @returns {string} 默认密码
 */
const generateDefaultPassword = (username) => {
  return `${username}@${new Date().getFullYear()}`;
};

module.exports = {
  initializeTenant,
  generateDefaultPassword,
};
