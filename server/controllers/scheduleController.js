const Course = require("../models/Course");
const User = require("../models/User");
const Classroom = require("../models/Classroom");
const Schedule = require("../models/Schedule");
const ScheduleTemplate = require("../models/ScheduleTemplate");
const SchedulingAlgorithm = require("../utils/SchedulingAlgorithm");
const XLSX = require("xlsx");

// 获取课表
exports.getSchedule = async (req, res) => {
  try {
    const { week, classId } = req.query;
    const query = {
      tenantId: req.user.tenantId,
      ...(week ? { week: parseInt(week) } : {}),
      ...(classId ? { classId } : {}),
    };

    const schedule = await Schedule.find(query)
      .populate("courseId")
      .populate("teacherId")
      .populate("classId")
      .populate("classroomId")
      .sort({ week: 1, day: 1, timeSlot: 1 });

    res.json(schedule);
  } catch (error) {
    console.error("获取课表失败:", error);
    res.status(500).json({ message: "获取课表失败" });
  }
};

// 生成课表
exports.generateSchedule = async (req, res) => {
  try {
    const {
      templateId,
      startWeek,
      endWeek,
      minDailyLessons,
      maxDailyLessons,
      distribution,
      allowAlternateWeeks,
      availableSlots,
      priority,
      considerClassroom,
      avoidTimeSlots,
    } = req.body;

    // 检查用户认证和学校信息
    if (!req.user || !req.user.school) {
      return res.status(401).json({ message: "未授权访问或缺少学校信息" });
    }

    // 获取所有必要数据
    const [teachers, courses, classrooms, template] = await Promise.all([
      User.find({ roles: { $in: ["teacher"] }, school: req.user.school }),
      Course.find({ school: req.user.school })
        .populate("teacher")
        .populate("classes"),
      Classroom.find({ status: "active", school: req.user.school }),
      ScheduleTemplate.findOne({
        _id: templateId,
        school: req.user.school,
      }),
    ]);

    if (!template) {
      return res.status(400).json({ message: "作息时间模板不存在" });
    }

    // 转换数据格式，确保 id 字段存在
    const formattedTeachers = teachers.map((t) => ({
      id: t._id.toString(),
      ...t.toObject(),
    }));

    // 为每个课程的每个班级创建一个排课任务
    const formattedCourses = [];
    for (const course of courses) {
      if (!course.classes || course.classes.length === 0) {
        console.warn(`课程 ${course.name} 没有关联的班级，跳过`);
        continue;
      }

      for (const cls of course.classes) {
        formattedCourses.push({
          id: `${course._id.toString()}_${cls._id.toString()}`,
          name: course.name,
          hours: course.hours,
          teacherId: course.teacher?._id.toString(),
          classId: cls._id.toString(),
          classroomId: course.classroomId?.toString(),
          ...course.toObject(),
        });
      }
    }

    const formattedClassrooms = classrooms.map((r) => ({
      id: r._id.toString(),
      ...r.toObject(),
    }));

    console.log("准备数据完成:");
    console.log("- 教师数量:", formattedTeachers.length);
    console.log("- 课程数量:", formattedCourses.length);
    console.log("- 教室数量:", formattedClassrooms.length);

    // 创建排课算法实例
    const scheduler = new SchedulingAlgorithm({
      templateId,
      startWeek,
      endWeek,
      minDailyLessons,
      maxDailyLessons,
      distribution,
      allowAlternateWeeks,
      availableSlots,
      priority,
      considerClassroom,
      avoidTimeSlots,
    });

    // 运行算法
    const scheduleItems = await scheduler.generate(
      formattedCourses,
      formattedTeachers,
      formattedClassrooms,
      template
    );

    // 添加学校和租户ID，并转换回真实的课程ID
    const schedule = scheduleItems.map((item) => ({
      courseId: item.courseId.split("_")[0], // 获取真实的课程ID
      teacherId: item.teacherId,
      classId: item.classId,
      classroomId: item.classroomId,
      week: item.week,
      day: item.day,
      timeSlot: item.timeSlot,
      school: req.user.school,
      tenant: req.user.tenant,
      templateId,
    }));

    // 保存排课结果
    await Schedule.deleteMany({
      week: { $gte: startWeek, $lte: endWeek },
      school: req.user.school,
    });
    await Schedule.insertMany(schedule);

    res.json({
      message: "排课成功",
      count: schedule.length,
      schedule,
    });
  } catch (error) {
    console.error("生成课表失败:", error);
    res.status(500).json({ message: error.message || "生成课表失败" });
  }
};

// 调整课表
exports.adjustSchedule = async (req, res) => {
  try {
    const { id, action, ...data } = req.body;

    // 确保只能修改自己租户的数据
    const query = { _id: id, tenantId: req.user.tenantId };

    if (action === "delete") {
      await Schedule.findOneAndDelete(query);
      res.json({ message: "删除成功" });
    } else if (action === "add") {
      const newSchedule = new Schedule({
        ...data,
        tenantId: req.user.tenantId,
      });
      await newSchedule.save();
      res.json({ message: "添加成功", schedule: newSchedule });
    } else if (action === "update") {
      const updatedSchedule = await Schedule.findOneAndUpdate(query, data, {
        new: true,
      });
      res.json({ message: "更新成功", schedule: updatedSchedule });
    }
  } catch (error) {
    console.error("调整课表失败:", error);
    res.status(500).json({ message: "调整课表失败" });
  }
};

// 检查时间冲突
exports.checkConflicts = async (req, res) => {
  try {
    const { week, day, timeSlot, teacherId, classroomId, classId, id } =
      req.body;

    const query = {
      tenantId: req.user.tenantId,
      week,
      day,
      timeSlot,
      $or: [{ teacherId }, { classroomId }, { classId }].filter(Boolean),
    };

    // 如果是更新操作，排除当前记录
    if (id) {
      query._id = { $ne: id };
    }

    const conflicts = await Schedule.find(query)
      .populate("courseId")
      .populate("teacherId")
      .populate("classId")
      .populate("classroomId");

    res.json(conflicts);
  } catch (error) {
    console.error("检查冲突失败:", error);
    res.status(500).json({ message: "检查冲突失败" });
  }
};

// 导出课表
exports.exportSchedule = async (req, res) => {
  try {
    const { week, classId } = req.query;
    const query = {
      tenantId: req.user.tenantId,
      ...(week ? { week: parseInt(week) } : {}),
      ...(classId ? { classId } : {}),
    };

    const schedule = await Schedule.find(query)
      .populate("courseId")
      .populate("teacherId")
      .populate("classId")
      .populate("classroomId")
      .sort({ week: 1, day: 1, timeSlot: 1 });

    // 转换数据为Excel格式
    const data = schedule.map((item) => ({
      周次: item.week,
      星期: getDayLabel(item.day),
      时间段: getTimeSlotLabel(item.timeSlot),
      课程: item.courseId.name,
      教师: item.teacherId.username,
      教室: item.classroomId
        ? `${item.classroomId.building}-${item.classroomId.room}`
        : "未分配",
      班级: item.classId.name,
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "课表");

    // 设置响应头
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=schedule_${Date.now()}.xlsx`
    );

    // 发送文件
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.send(buffer);
  } catch (error) {
    console.error("导出课表失败:", error);
    res.status(500).json({ message: "导出课表失败" });
  }
};

// 辅助函数
function getDayLabel(day) {
  const days = {
    monday: "周一",
    tuesday: "周二",
    wednesday: "周三",
    thursday: "周四",
    friday: "周五",
  };
  return days[day] || day;
}

function getTimeSlotLabel(timeSlot) {
  return `第${timeSlot}节`;
}
