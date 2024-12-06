const Schedule2 = require("../models/Schedule2");
const Course = require("../models/Course");
const Class = require("../models/Class");
const ScheduleTemplate = require("../models/ScheduleTemplate");
const Algorithm2 = require("../utils/Algorithm2");
const { catchAsync } = require("../utils/errors");

class ScheduleController2 {
  /**
   * 生成课表
   */
  generateSchedule = catchAsync(async (req, res) => {
    const {
      templateId, // 学时模板ID
      semester, // 学期
      startWeek = 1, // 开始周次
      endWeek = 20, // 结束周次
      availableSlots = [], // 可用时间段ID数组
    } = req.body;

    const { school, tenant } = req.user;

    // 1. 获取学时模板
    const template = await ScheduleTemplate.findById(templateId).populate(
      "timeSlots"
    ); //这行估计有问题
    if (!template) {
      return res.status(404).json({
        status: "error",
        message: "未找到学时模板",
      });
    }

    // 2. 获取需要排课的课程
    const courses = await Course.find({
      school,
      semester,
      status: "active",
    }).populate([
      {
        path: "teacher",
        select: "name availableTime", // 确保获取教师可用时间
      },
      {
        path: "classes",
        select: "name grade availableTime", // 确保获取班级可用时间
      },
    ]);

    if (!courses.length) {
      return res.status(404).json({
        status: "error",
        message: "未找到需要排课的课程",
      });
    }

    // 3. 准备算法所需的四个关键参数
    const algorithmParams = {
      courses, // 课程信息（包含教师和班级信息）
      timeSlots: template.timeSlots, // 时间槽信息
      constraints: {
        // 约束条件
        startWeek,
        endWeek,
        availableSlots,
        template,
      },
      preferences: {
        // 偏好设置（可以根据实际需求扩展）
        teacherAvailability: courses.map((course) => ({
          teacherId: course.teacher._id,
          availableTime: course.teacher.availableTime || [],
        })),
        classAvailability: courses.flatMap((course) =>
          course.classes.map((cls) => ({
            classId: cls._id,
            availableTime: cls.availableTime || [],
          }))
        ),
      },
    };

    // 4. 初始化排课算法并生成课表
    const algorithm = new Algorithm2(algorithmParams);
    const schedules = await algorithm.generate();

    // 5. 保存到数据库
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
}

module.exports = new ScheduleController2();
