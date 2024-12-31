const Schedule2 = require("../models/Schedule2");
const Course = require("../models/Course");
const Class = require("../models/Class");
const ScheduleTemplate = require("../models/ScheduleTemplate");
const Algorithm2 = require("../utils/Algorithm2");
const { catchAsync } = require("../utils/errors");
const User = require("../models/User");
const ScheduleOptimizer = require("../utils/ScheduleOptimizer");

class ScheduleController2 {
  /**
   * 生成课表
   */
  generateSchedule = catchAsync(async (req, res) => {
    const {
      templateId,
      startWeek = 1,
      endWeek = 20,
      minDailyLessons = 2,
      maxDailyLessons = 3,
      allowAlternateWeeks = true,
      considerClassroom = false,
      avoidTimeSlots = [],
      availableSlots = [],
      semester = "2024秋季",
    } = req.body;

    const { school, tenant } = req.user;

    // 1. 获取学时模板
    const template = await ScheduleTemplate.findById(templateId).lean();
    if (!template) {
      return res.status(404).json({
        status: "error",
        message: "未找到学时模板",
      });
    }

    // 2. 获���班级
    const classes = await Class.find({
      school,
      status: "active",
    }).lean();

    // 3. 获取所有课程和教师信息
    const courses = await Course.find({
      school,
      semester,
      status: "active",
    })
      .populate("teacher")
      .lean();

    // 4. 获取所有教师
    const teachers = await User.find({
      school,
      roles: "teacher",
      status: "active",
    }).lean();

    // 5. 过滤出可用的时间槽
    const filteredPeriods = {
      morning:
        template.periods.morning?.filter(
          (slot) =>
            availableSlots.includes(slot._id.toString()) &&
            !avoidTimeSlots.includes(slot._id.toString())
        ) || [],
      afternoon:
        template.periods.afternoon?.filter(
          (slot) =>
            availableSlots.includes(slot._id.toString()) &&
            !avoidTimeSlots.includes(slot._id.toString())
        ) || [],
      evening:
        template.periods.evening?.filter(
          (slot) =>
            availableSlots.includes(slot._id.toString()) &&
            !avoidTimeSlots.includes(slot._id.toString())
        ) || [],
    };

    // 6. 初始化排课算法
    const algorithm = new Algorithm2(
      classes,
      courses,
      teachers,
      { ...template, periods: filteredPeriods },
      {
        allowAlternateWeeks,
        allowConsecutivePeriods: false,
        maxCoursesPerDay: maxDailyLessons,
      }
    );

    // 7. 生成课表
    const schedules = await algorithm.schedule();

    // 8. 保存到数据库
    const savedSchedules = await Schedule2.insertMany(
      schedules.map((schedule) => ({
        ...schedule,
        tenant,
        school,
        semester,
        status: "draft",
      }))
    );

    res.status(200).json({
      status: "success",
      data: savedSchedules,
    });
  });

  /**
   * 获取课表列表
   */
  getSchedules = catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      week,
      classId,
      teacherId,
    } = req.query;

    const { school } = req.user;

    // 构建查询条件
    const query = { school };
    if (status) query.status = status;
    if (week) query.weeks = week;
    if (classId) query.classId = classId;
    if (teacherId) query.teacherId = teacherId;

    // 分页查询
    const schedules = await Schedule2.find(query)
      .populate("course")
      .populate("class")
      .populate("teacher")
      .populate("timeSlot")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // 获取总数
    const total = await Schedule2.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: schedules,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  });

  /**
   * 获取周课表
   */
  getWeekSchedule = catchAsync(async (req, res) => {
    const { week, classId, teacherId } = req.query;
    const { school } = req.user;

    if (!week) {
      return res.status(400).json({
        status: "error",
        message: "请指定周次",
      });
    }

    const query = { school, weeks: week };
    if (classId) query.classId = classId;
    if (teacherId) query.teacherId = teacherId;

    const schedules = await Schedule2.find(query)
      .populate("course")
      .populate("class")
      .populate("teacher")
      .populate("timeSlot")
      .sort({ dayOfWeek: 1, "timeSlot.startTime": 1 });

    res.status(200).json({
      status: "success",
      data: schedules,
    });
  });

  /**
   * 更新课表状态
   */
  updateScheduleStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { school } = req.user;

    const schedule = await Schedule2.findOneAndUpdate(
      { _id: id, school },
      { status },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({
        status: "error",
        message: "未找到课表记录",
      });
    }

    res.status(200).json({
      status: "success",
      data: schedule,
    });
  });

  /**
   * 批量更新课表状态
   */
  batchUpdateStatus = catchAsync(async (req, res) => {
    const { ids, status } = req.body;
    const { school } = req.user;

    const result = await Schedule2.updateMany(
      { _id: { $in: ids }, school },
      { status }
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  /**
   * 删除课表
   */
  deleteSchedule = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { school } = req.user;

    const schedule = await Schedule2.findOneAndDelete({ _id: id, school });

    if (!schedule) {
      return res.status(404).json({
        status: "error",
        message: "未找到课表记录",
      });
    }

    res.status(200).json({
      status: "success",
      data: schedule,
    });
  });

  /**
   * 批量删除课表
   */
  batchDelete = catchAsync(async (req, res) => {
    const { ids } = req.body;
    const { school } = req.user;

    const result = await Schedule2.deleteMany({
      _id: { $in: ids },
      school,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  /**
   * 获取指定班级和周次的排课结果
   */
  getScheduleByClassAndWeek = catchAsync(async (req, res) => {
    const { classId, week } = req.query;
    const { school, tenant } = req.user;

    if (!classId || !week) {
      return res.status(400).json({
        status: "error",
        message: "请提供班级ID和周次",
      });
    }

    // 查询该班级在指定周次的所有课程安排
    const schedules = await Schedule2.find({
      school,
      tenant,
      classId,
      weeks: { $in: [parseInt(week)] },
      status: { $ne: "deleted" },
    })
      .populate([
        {
          path: "courseId",
          select: "name color", // 课程名称和颜色
        },
        {
          path: "teacherId",
          select: "name", // 教师姓名
        },
      ])
      .sort({ dayOfWeek: 1, timeSlotId: 1 });

    res.status(200).json({
      status: "success",
      data: schedules,
    });
  });

  /**
   * 获取指定教师和周次的排课结果
   */
  getScheduleByTeacherAndWeek = catchAsync(async (req, res) => {
    const { teacherId, week } = req.query;
    const { school, tenant } = req.user;

    if (!teacherId || !week) {
      return res.status(400).json({
        status: "error",
        message: "请提供教师ID和周次",
      });
    }

    // 查询该教师在指定周次的所有课程安排
    const schedules = await Schedule2.find({
      school,
      tenant,
      teacherId,
      weeks: { $in: [parseInt(week)] },
      status: { $ne: "deleted" },
    })
      .populate([
        {
          path: "courseId",
          select: "name color",
        },
        {
          path: "classId",
          select: "name grade", // 班级名称和年级
        },
      ])
      .sort({ dayOfWeek: 1, timeSlotId: 1 });

    res.status(200).json({
      status: "success",
      data: schedules,
    });
  });

  /**
   * 获取指定班级的全部课程安排
   */
  getClassScheduleFull = catchAsync(async (req, res) => {
    const { classId } = req.query;
    const { school, tenant } = req.user;

    if (!classId) {
      return res.status(400).json({
        status: "error",
        message: "请提供班级ID",
      });
    }

    // 查询该班级的所有课程安排
    const schedules = await Schedule2.find({
      school,
      tenant,
      classId,
      status: { $ne: "deleted" },
    })
      .populate([
        {
          path: "courseId",
          select: "name color", // 课程名称和颜色
        },
        {
          path: "teacherId",
          select: "name", // 教师姓名
        },
      ])
      .sort({ dayOfWeek: 1, timeSlotId: 1 });

    res.status(200).json({
      status: "success",
      data: schedules,
    });
  });

  /**
   * 获取指定教师的全部课程安排
   */
  getTeacherScheduleFull = catchAsync(async (req, res) => {
    const { teacherId } = req.query;
    const { school, tenant } = req.user;

    if (!teacherId) {
      return res.status(400).json({
        status: "error",
        message: "请提供教师ID",
      });
    }

    // 查询该教师的所有课程安排
    const schedules = await Schedule2.find({
      school,
      tenant,
      teacherId,
      status: { $ne: "deleted" },
    })
      .populate([
        {
          path: "courseId",
          select: "name color",
        },
        {
          path: "classId",
          select: "name grade", // 班级名称和年级
        },
      ])
      .sort({ dayOfWeek: 1, timeSlotId: 1 });

    res.status(200).json({
      status: "success",
      data: schedules,
    });
  });

  /**
   * 检查课程时间冲突
   */
  checkScheduleConflicts = async (req, res) => {
    try {
      const { scheduleId, targetTimeSlot, targetDay } = req.body;
      const { school, tenant } = req.user;

      // 获取源课程信息
      const sourceSchedule = await Schedule2.findOne({
        _id: scheduleId,
        school,
        tenant,
        status: { $ne: "deleted" },
      }).populate([
        {
          path: "teacherId",
          select: "name",
        },
        {
          path: "classId",
          select: "name",
        },
        {
          path: "courseId",
          select: "name",
        },
      ]);

      if (!sourceSchedule) {
        return res.status(404).json({
          status: "error",
          message: "课程不存在",
        });
      }

      const conflicts = [];

      // 1. 检查教师时间冲突
      const teacherConflicts = await Schedule2.find({
        school,
        tenant,
        teacherId: sourceSchedule.teacherId,
        timeSlotId: targetTimeSlot,
        dayOfWeek: targetDay,
        weeks: { $in: sourceSchedule.weeks }, // 检查周次是否有重叠
        _id: { $ne: scheduleId },
        status: { $ne: "deleted" },
      }).populate([
        {
          path: "teacherId",
          select: "name",
        },
        {
          path: "classId",
          select: "name",
        },
        {
          path: "courseId",
          select: "name",
        },
      ]);

      if (teacherConflicts.length > 0) {
        conflicts.push(
          ...teacherConflicts.map((conflict) => ({
            type: "teacher",
            existingSchedule: {
              id: conflict._id,
              courseName: conflict.courseId?.name || "未知课程",
              teacherName: conflict.teacherId?.name || "未知教师",
              className: conflict.classId?.name || "未知班级",
              classId: conflict.classId?._id, // 添加班级ID
              weeks: conflict.weeks,
            },
          }))
        );
      }

      // 2. 检查班级时间冲突
      const classConflicts = await Schedule2.find({
        school,
        tenant,
        classId: sourceSchedule.classId,
        timeSlotId: targetTimeSlot,
        dayOfWeek: targetDay,
        weeks: { $in: sourceSchedule.weeks }, // 检查周次是否有重叠
        _id: { $ne: scheduleId },
        status: { $ne: "deleted" },
      }).populate([
        {
          path: "teacherId",
          select: "name",
        },
        {
          path: "classId",
          select: "name",
        },
        {
          path: "courseId",
          select: "name",
        },
      ]);

      if (classConflicts.length > 0) {
        conflicts.push(
          ...classConflicts.map((conflict) => ({
            type: "class",
            existingSchedule: {
              id: conflict._id,
              courseName: conflict.courseId?.name || "未知课程",
              teacherName: conflict.teacherId?.name || "未知教师",
              className: conflict.classId?.name || "未知班级",
              classId: conflict.classId?._id, // 添加班级ID
              weeks: conflict.weeks,
            },
          }))
        );
      }

      res.json({
        status: "success",
        data: conflicts,
      });
    } catch (error) {
      console.error("检查课程冲突失败:", error);
      res.status(500).json({
        status: "error",
        message: "检查课程冲突失败",
      });
    }
  };

  /**
   * 更新课程时间
   */
  updateScheduleTime = async (req, res) => {
    try {
      const { scheduleId, newTimeSlot, newDay } = req.body;
      const { school, tenant } = req.user;

      // 更新课程时间
      const updatedSchedule = await Schedule2.findOneAndUpdate(
        {
          _id: scheduleId,
          school,
          tenant,
          status: { $ne: "deleted" },
        },
        {
          timeSlotId: newTimeSlot,
          dayOfWeek: newDay,
          updatedAt: new Date(),
          updatedBy: req.user._id,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate([
        {
          path: "teacherId",
          select: "name",
        },
        {
          path: "classId",
          select: "name",
        },
        {
          path: "courseId",
          select: "name",
        },
      ]);

      if (!updatedSchedule) {
        return res.status(404).json({
          status: "error",
          message: "课程不存在",
        });
      }

      res.json({
        status: "success",
        data: updatedSchedule,
      });
    } catch (error) {
      console.error("更新课程时间失败:", error);
      res.status(500).json({
        status: "error",
        message: "更新课程时间失败",
      });
    }
  };

  /**
   * 获取课表统计数据
   */
  getStatistics = async (req, res) => {
    try {
      const { tenant, school } = req.user;

      // 添加调试日志
      console.log("查询条件:", {
        tenant,
        school,
        userInfo: req.user,
      });

      // 先检查数据库中是否有数据
      const totalCount = await Schedule2.countDocuments({
        tenant,
        school,
      });

      console.log("数据库中的总记录数:", totalCount);

      // 获取所有课表数据
      const schedules = await Schedule2.find({
        tenant,
        school,
        // 暂时注status条件，看看是否有数据
        // status: { $ne: "archived" }
      })
        .populate({
          path: "courseId",
          select: "name type",
        })
        .populate({
          path: "classId",
          select: "name",
        })
        .populate({
          path: "teacherId",
          select: "name",
        })
        .populate({
          path: "timeSlotId",
          select: "name startTime endTime creditHours",
        })
        .lean();

      console.log("查询到的课表数据:", {
        count: schedules.length,
        firstRecord: schedules[0]
          ? {
              courseId: schedules[0].courseId,
              classId: schedules[0].classId,
              teacherId: schedules[0].teacherId,
              timeSlot: schedules[0].timeSlotId,
            }
          : null,
      });

      // 1. 班级课时统计
      const classStats = [];
      const classMap = new Map();

      schedules.forEach((schedule) => {
        if (
          !schedule.classId ||
          !schedule.classId._id ||
          !schedule.timeSlotId
        ) {
          console.log("发现无效的班级数据:", schedule);
          return;
        }

        const classId = schedule.classId._id.toString();
        const weekCount = schedule.weeks ? schedule.weeks.length : 0;
        const creditHours = schedule.timeSlotId?.creditHours || 0;
        const totalHoursForSchedule = creditHours * weekCount;

        if (!classMap.has(classId)) {
          classMap.set(classId, {
            className: schedule.classId.name || "未知班级",
            totalHours: 0,
            weekCount: 20,
          });
        }

        const stats = classMap.get(classId);
        stats.totalHours += totalHoursForSchedule;
      });

      classMap.forEach((stats) => {
        stats.weeklyHours = +(stats.totalHours / stats.weekCount).toFixed(1);
        classStats.push({
          className: stats.className,
          totalHours: stats.totalHours,
          weeklyHours: stats.weeklyHours,
        });
      });

      // 2. 教师课时统计
      const teacherStats = [];
      const teacherMap = new Map();

      schedules.forEach((schedule) => {
        if (
          !schedule.teacherId ||
          !schedule.teacherId._id ||
          !schedule.timeSlotId
        ) {
          console.log("发现无效的教师数据:", schedule);
          return;
        }

        const teacherId = schedule.teacherId._id.toString();
        const weekCount = schedule.weeks ? schedule.weeks.length : 0;
        const creditHours = schedule.timeSlotId?.creditHours || 0;
        const totalHoursForSchedule = creditHours * weekCount;

        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            teacherName: schedule.teacherId.name || "未知教师",
            totalHours: 0,
            weekCount: 20,
          });
        }

        const stats = teacherMap.get(teacherId);
        stats.totalHours += totalHoursForSchedule;
      });

      teacherMap.forEach((stats) => {
        stats.weeklyHours = +(stats.totalHours / stats.weekCount).toFixed(1);
        teacherStats.push({
          teacherName: stats.teacherName,
          totalHours: stats.totalHours,
          weeklyHours: stats.weeklyHours,
        });
      });

      // 3. 课程课时统计
      const courseStats = [];
      const courseMap = new Map();

      schedules.forEach((schedule) => {
        if (
          !schedule.courseId ||
          !schedule.courseId._id ||
          !schedule.timeSlotId
        ) {
          console.log("发现无效的课程数据:", schedule);
          return;
        }

        const courseId = schedule.courseId._id.toString();
        const weekCount = schedule.weeks ? schedule.weeks.length : 0;
        const creditHours = schedule.timeSlotId?.creditHours || 0;
        const totalHoursForSchedule = creditHours * weekCount;

        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            courseName: schedule.courseId.name || "未知课程",
            totalHours: 0,
            weekCount: 20,
          });
        }

        const stats = courseMap.get(courseId);
        stats.totalHours += totalHoursForSchedule;
      });

      courseMap.forEach((stats) => {
        stats.weeklyHours = +(stats.totalHours / stats.weekCount).toFixed(1);
        courseStats.push({
          courseName: stats.courseName,
          totalHours: stats.totalHours,
          weeklyHours: stats.weeklyHours,
        });
      });

      // 4. 每日课程和教师统计
      const dailyDistribution = {
        lessons: Array(5).fill(0), // 周一到周五的课程数
        teachers: Array(5).fill(0), // 周一到周五的教师数
      };

      // 用于统计每天的唯一教师
      const dailyTeachers = Array(5)
        .fill()
        .map(() => new Set());

      schedules.forEach((schedule) => {
        const dayIndex = schedule.dayOfWeek - 1; // 转换为0-4的索引
        if (dayIndex >= 0 && dayIndex < 5) {
          // 统计课程数
          dailyDistribution.lessons[dayIndex]++;
          // 记录教师
          if (schedule.teacherId) {
            dailyTeachers[dayIndex].add(schedule.teacherId._id.toString());
          }
        }
      });

      // 计算每天的教师数
      dailyTeachers.forEach((teachers, index) => {
        dailyDistribution.teachers[index] = teachers.size;
      });

      // 5. 班级课程数量统计
      const classLessonsMap = new Map();

      schedules.forEach((schedule) => {
        if (!schedule.classId || !schedule.classId._id || !schedule.courseId)
          return;

        const classId = schedule.classId._id.toString();
        const className = schedule.classId.name || "未知班级";
        const courseId = schedule.courseId._id.toString();

        if (!classLessonsMap.has(classId)) {
          classLessonsMap.set(classId, {
            name: className,
            value: 0,
            courses: new Set(), // 使用 Set 来存储唯一的课程 ID
          });
        }

        // 添加课程 ID 到 Set 中
        classLessonsMap.get(classId).courses.add(courseId);
      });

      // 转换为最终结果，使用 Set 的大小作为课程数量
      const classLessonsDistribution = Array.from(classLessonsMap.values())
        .map((item) => ({
          name: item.name,
          value: item.courses.size, // 使用 Set 的大小作为课程数量
        }))
        .sort((a, b) => a.name.localeCompare(b.name)); // 按班级名称排序

      // 添加调试日志
      console.log("统计结果:", {
        scheduleCount: schedules.length,
        classStatsCount: classStats.length,
        teacherStatsCount: teacherStats.length,
        classLessonsCount: classLessonsDistribution.length,
        dailyDistribution,
      });

      res.json({
        classStats,
        teacherStats,
        courseStats,
        dailyDistribution,
        classLessonsDistribution,
      });
    } catch (error) {
      console.error("获取统计数据失败:", error);
      res.status(500).json({
        message: "获取统计数据失败",
        error: error.message,
      });
    }
  };

  // 优化课表分布
  optimizeSchedule = async (req, res) => {
    try {
      const { tenant, school } = req.user;
      const { options } = req.body;

      // 获取当前课表
      const schedules = await Schedule2.find({
        tenant,
        school,
        status: { $ne: "archived" },
      })
        .populate("courseId")
        .populate("classId")
        .populate("teacherId")
        .lean();

      // 检查是否有课表数据
      if (!schedules || schedules.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "没有找到可优化的课表数据",
        });
      }

      // 检查数据完整性
      const validSchedules = schedules.filter((schedule) => {
        const isValid =
          schedule.courseId && schedule.classId && schedule.teacherId;
        if (!isValid) {
          console.warn("发现无效课程数据:", {
            id: schedule._id,
            courseId: schedule.courseId,
            classId: schedule.classId,
            teacherId: schedule.teacherId,
          });
        }
        return isValid;
      });

      if (validSchedules.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "所有程数据都不完整，无法进行优化",
        });
      }

      // 创建优化器实例
      const optimizer = new ScheduleOptimizer(validSchedules, options);

      // 执行优化
      const result = optimizer.optimize();

      // 如果优化成功且有改进，更新数据库
      if (result.success && result.improvements > 0) {
        // 批量更新课程的 dayOfWeek
        const updatePromises = result.schedules.map((schedule) =>
          Schedule2.updateOne(
            { _id: schedule._id },
            { $set: { dayOfWeek: schedule.dayOfWeek } }
          )
        );
        await Promise.all(updatePromises);

        return res.json({
          status: "success",
          message: "课表优化完成",
          result: {
            ...result,
            totalSchedules: validSchedules.length,
            invalidSchedules: schedules.length - validSchedules.length,
          },
        });
      } else {
        return res.json({
          status: "success",
          message: "当前课表分布已经很均衡，无需调整",
          result: {
            improvements: 0,
            totalSchedules: validSchedules.length,
            invalidSchedules: schedules.length - validSchedules.length,
          },
        });
      }
    } catch (error) {
      console.error("化课表失败:", error);
      res.status(500).json({
        status: "error",
        message: "优化课表失败",
        error: error.message,
      });
    }
  };

  // 清除排课结果
  clearSchedule = async (req, res) => {
    try {
      // 删除当前租户和学校的所有排课记录
      const result = await Schedule2.deleteMany({
        tenant: req.user.tenant,
        school: req.user.school,
      });

      res.json({
        message: "清除排课成功",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("清除排课失败:", error);
      res.status(500).json({
        message: "清除排课失败",
        error: error.message,
      });
    }
  };
}

module.exports = new ScheduleController2();
