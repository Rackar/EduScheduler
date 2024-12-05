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
    console.log("查询参数:", { week, classId });
    console.log("当前用户:", {
      school: req.user.school,
      tenant: req.user.tenant,
    });

    const query = {
      school: req.user.school,
      ...(week ? { week: parseInt(week) } : {}),
      ...(classId ? { classId } : {}),
    };

    console.log("查询条件:", query);

    const schedule = await Schedule.find(query)
      .populate({
        path: "courseId",
        select: "name code hours type",
        model: "Course",
      })
      .populate({
        path: "teacherId",
        select: "username name email",
        model: "User",
      })
      .populate({
        path: "classId",
        select: "name department grade classNumber",
        model: "Class",
      })
      .populate({
        path: "classroomId",
        select: "building room capacity",
        model: "Classroom",
      })
      .sort({ week: 1, day: 1, timeSlot: 1 });

    console.log("查询结果数量:", schedule.length);

    // 转换数据格式
    const formattedSchedule = schedule.map((item) => ({
      id: item._id.toString(),
      week: item.week,
      day: item.day,
      timeSlot: item.timeSlot,
      course: item.courseId
        ? {
            id: item.courseId._id.toString(),
            name: item.courseId.name,
            code: item.courseId.code,
            hours: item.courseId.hours,
            type: item.courseId.type,
          }
        : null,
      teacher: item.teacherId
        ? {
            id: item.teacherId._id.toString(),
            username: item.teacherId.username,
            name: item.teacherId.name,
            email: item.teacherId.email,
          }
        : null,
      class: item.classId
        ? {
            id: item.classId._id.toString(),
            name: item.classId.name,
            department: item.classId.department,
            grade: item.classId.grade,
            classNumber: item.classId.classNumber,
          }
        : null,
      classroom: item.classroomId
        ? {
            id: item.classroomId._id.toString(),
            building: item.classroomId.building,
            room: item.classroomId.room,
            capacity: item.classroomId.capacity,
          }
        : null,
    }));

    console.log("返回数据数量:", formattedSchedule.length);

    res.json(formattedSchedule);
  } catch (error) {
    console.error("获取课表失败:", error);
    res.status(500).json({ message: "获取课表失败" });
  }
};

// 生成课表
exports.generateSchedule = async (req, res) => {
  try {
    const {
      startWeek = 1,
      endWeek = 20,
      minDailyLessons = 2,
      maxDailyLessons = 3,
      distribution = "balanced",
      allowAlternateWeeks = true,
      priority = "teacher",
      considerClassroom = false,
      avoidTimeSlots = [],
      availableSlots = [],
      templateId = "",
    } = req.body;

    console.log("开始查询课程数据");
    console.log("租户ID:", req.user.tenant);
    console.log("学校ID:", req.user.school);

    // 获取需要排课的课程
    const courses = await Course.find({
      tenant: req.user.tenant,
      school: req.user.school,
      status: "active",
    }).populate("teacher classes");

    console.log(`找到 ${courses.length} 门需要排课的课程`);

    if (courses.length > 0) {
      console.log("课程示例:", {
        name: courses[0].name,
        hours: courses[0].hours,
        weeks: courses[0].weeks,
        teacher: courses[0].teacher?.name,
        classes: courses[0].classes?.map((c) => c.name),
      });
    }

    if (!courses.length) {
      return res.json({
        message: "没有找到需要排课的课程",
        count: 0,
        schedule: [],
      });
    }

    let template;
    if (!templateId) {
      return res.status(400).json({
        message: "作息时间模板是必需的",
      });
    } else {
      template = await ScheduleTemplate.findById(templateId);
    }

    // 初始化排课算法
    const algorithm = new SchedulingAlgorithm(courses, {
      startWeek,
      endWeek,
      minDailyLessons,
      maxDailyLessons,
      distribution,
      allowAlternateWeeks,
      priority,
      considerClassroom,
      avoidTimeSlots,
      availableSlots,
      template,
    });

    // 生成课表
    const schedule = await algorithm.generate();
    console.log(`生成了 ${schedule.length} 条排课记录`);

    // 保存课表
    await Schedule.deleteMany({
      tenant: req.user.tenant,
      school: req.user.school,
      status: "draft",
    });

    if (schedule.length > 0) {
      const scheduleWithTenant = schedule.map((item) => ({
        ...item,
        tenant: req.user.tenant,
        school: req.user.school,
      }));

      await Schedule.insertMany(scheduleWithTenant);
      console.log("成功保存课表");
    }

    res.json({
      message: "排课成功",
      count: schedule.length,
      schedule,
    });
  } catch (error) {
    console.error("生成课表失败:", error);
    res.status(500).json({
      message: "生成课表失败",
      error: error.message,
    });
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
