const seedData = require("../seedData");
const User = require("../models/User");
const Course = require("../models/Course");
const Classroom = require("../models/Classroom");
const Class = require("../models/Class");
const TimeSlot = require("../models/TimeSlot");

exports.initializeData = async (req, res) => {
  try {
    // 清空所有集合
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Classroom.deleteMany({}),
      Class.deleteMany({}),
      TimeSlot.deleteMany({}),
    ]);

    // 插入用户数据
    const users = await User.create(seedData.users);

    // 插入课程数据
    const courses = await Course.create(seedData.courses);

    // 将第一个课程分配给第一个教师
    await Course.findByIdAndUpdate(courses[0]._id, {
      teacher: users.find((u) => u.role === "teacher")._id,
    });

    // 插入教室数据
    const classrooms = await Classroom.create(seedData.classrooms);

    // 插入班级数据
    const classesData = seedData.classes.map((classData) => ({
      ...classData,
      headTeacher: users.find((u) => u.role === "teacher")._id,
    }));
    const classes = await Class.create(classesData);

    // 插入时间段数据
    const timeSlots = await TimeSlot.create(seedData.timeSlots);

    // 为第一个班级添加一个课程安排示例
    await Class.findByIdAndUpdate(classes[0]._id, {
      $push: {
        courses: {
          course: courses[0]._id,
          classroom: classrooms[0]._id,
          schedule: [
            {
              dayOfWeek: 1,
              startTime: timeSlots[0].startTime,
              endTime: timeSlots[0].endTime,
            },
          ],
        },
      },
    });

    res.json({
      message: "数据初始化成功",
      summary: {
        users: users.length,
        courses: courses.length,
        classrooms: classrooms.length,
        classes: classes.length,
        timeSlots: timeSlots.length,
      },
    });
  } catch (error) {
    console.error("初始化数据失败:", error);
    res.status(500).json({
      message: "初始化数据失败",
      error: error.message,
    });
  }
};
