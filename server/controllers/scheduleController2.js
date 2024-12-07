const Schedule2 = require("../models/Schedule2");
const Course = require("../models/Course");
const Class = require("../models/Class");
const ScheduleTemplate = require("../models/ScheduleTemplate");
const Algorithm2 = require("../utils/Algorithm2");
const { catchAsync } = require("../utils/errors");
const User = require("../models/User");

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

    // 2. 获取所有班级
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
}

module.exports = new ScheduleController2();
