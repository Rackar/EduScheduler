const Course = require("../models/Course");
const User = require("../models/User");
const Classroom = require("../models/Classroom");
const Schedule = require("../models/Schedule");
const SchedulingAlgorithm = require("../utils/SchedulingAlgorithm");
const XLSX = require("xlsx");

// 获取课表
exports.getSchedule = async (req, res) => {
  try {
    const { week } = req.query;
    const query = week ? { week: parseInt(week) } : {};

    const schedule = await Schedule.find(query)
      .populate("course")
      .populate("teacher")
      .populate("classroom")
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
      startWeek,
      endWeek,
      priority,
      considerClassroom = false,
    } = req.body;

    // 获取所有必要数据
    const promises = [
      User.find({ role: "teacher" }),
      Course.find().populate("teacher"),
    ];

    // 只有在需要考虑教室时才获取教室数据
    if (considerClassroom) {
      promises.push(Classroom.find({ status: "可用" }));
    }

    const [teachers, courses, classrooms = []] = await Promise.all(promises);

    // 创建排课算法实例
    const scheduler = new SchedulingAlgorithm(
      teachers,
      courses,
      classrooms,
      startWeek,
      endWeek,
      priority,
      considerClassroom
    );

    // 运行算法
    const schedule = await scheduler.run();

    // 如果不考虑教室，为每个课程分配默认教室
    const finalSchedule = considerClassroom
      ? schedule
      : schedule.map((item) => ({
          ...item,
          classroom: item.course.classroom || null, // 使用课程绑定的教室或null
        }));

    // 保存排课结果
    await Schedule.deleteMany({ week: { $gte: startWeek, $lte: endWeek } });
    await Schedule.insertMany(finalSchedule);

    res.json({ message: "排课成功", schedule: finalSchedule });
  } catch (error) {
    console.error("生成课表失败:", error);
    res.status(500).json({ message: "生成课表失败", error: error.message });
  }
};

// 调整课表
exports.adjustSchedule = async (req, res) => {
  try {
    const { id, action, ...data } = req.body;

    if (action === "delete") {
      await Schedule.findByIdAndDelete(id);
      res.json({ message: "删除成功" });
    } else if (action === "add") {
      const newSchedule = new Schedule(data);
      await newSchedule.save();
      res.json({ message: "添加成功", schedule: newSchedule });
    } else if (action === "update") {
      const updatedSchedule = await Schedule.findByIdAndUpdate(id, data, {
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
    const { week, day, timeSlot, teacherId, classroomId, id } = req.body;

    const query = {
      week,
      day,
      timeSlot,
      $or: [{ teacher: teacherId }, { classroom: classroomId }],
    };

    // 如果是更新操作，排除当前记录
    if (id) {
      query._id = { $ne: id };
    }

    const conflicts = await Schedule.find(query)
      .populate("course")
      .populate("teacher")
      .populate("classroom");

    res.json(conflicts);
  } catch (error) {
    console.error("检查冲突失败:", error);
    res.status(500).json({ message: "检查冲突失败" });
  }
};

// 导出课表
exports.exportSchedule = async (req, res) => {
  try {
    const { week } = req.query;
    const query = week ? { week: parseInt(week) } : {};

    const schedule = await Schedule.find(query)
      .populate("course")
      .populate("teacher")
      .populate("classroom")
      .sort({ week: 1, day: 1, timeSlot: 1 });

    // 转换数据为Excel格式
    const data = schedule.map((item) => ({
      周次: item.week,
      星期: getDayLabel(item.day),
      时间段: getTimeSlotLabel(item.timeSlot),
      课程: item.course.name,
      教师: item.teacher.username,
      教室: `${item.classroom.building}-${item.classroom.room}`,
      班级: item.course.className,
      学生人数: item.course.studentCount,
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
