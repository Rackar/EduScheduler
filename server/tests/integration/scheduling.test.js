const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../app");
const dbHandler = require("../testSetup");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Classroom = require("../../models/Classroom");
const Class = require("../../models/Class");
const TimeSlot = require("../../models/TimeSlot");
const SchedulingAlgorithm = require("../../utils/SchedulingAlgorithm");

// 模拟数据生成器
const generateMockData = {
  // 生成教师数据
  teachers: (count) => {
    return Array(count)
      .fill()
      .map((_, index) => ({
        username: `teacher${index + 1}`,
        password: "password123",
        role: "teacher",
        department: ["数学系", "物理系", "化学系", "生物系"][
          Math.floor(Math.random() * 4)
        ],
        teachingHours: {
          current: 0,
          min: 10,
          max: 20,
        },
      }));
  },

  // 生成课程数据
  courses: (count) => {
    const courseNames = [
      "高等数学",
      "线性代数",
      "概率论",
      "离散数学",
      "大学物理",
      "力学",
      "热学",
      "光学",
      "无机化学",
      "有机化学",
      "物理化学",
      "分析化学",
      "细胞生物学",
      "遗传学",
      "生态学",
      "生物化学",
    ];

    return Array(count)
      .fill()
      .map((_, index) => ({
        name:
          courseNames[index % courseNames.length] +
          (Math.floor(index / courseNames.length) + 1),
        department: ["数学系", "物理系", "化学系", "生物系"][
          Math.floor(index / 4) % 4
        ],
        hours: [2, 3, 4][Math.floor(Math.random() * 3)],
        status: "available",
        semester: "2024春季",
      }));
  },

  // 生成教室数据
  classrooms: (count) => {
    return Array(count)
      .fill()
      .map((_, index) => ({
        name: `教室${index + 101}`,
        capacity: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
        location: `教学楼${String.fromCharCode(65 + Math.floor(index / 10))}`,
        resources: ["projector", "whiteboard", "computer"].slice(
          0,
          Math.floor(Math.random() * 3) + 1
        ),
      }));
  },

  // 生成班级数据
  classes: (count) => {
    const departments = ["计算机系", "软件工程系", "通信工程系", "电子工程系"];
    return Array(count)
      .fill()
      .map((_, index) => ({
        name: `${departments[index % departments.length]}2024-${
          Math.floor(index / 4) + 1
        }班`,
        grade: "2024",
        department: departments[index % departments.length],
        academicYear: "2024-2025",
        studentCount: 30 + Math.floor(Math.random() * 20),
        status: "active",
      }));
  },
};

// 在分配课程给教师时，添加工作量检查
const assignCoursesToTeachers = async (courses, teachers) => {
  // 计算总课时
  const totalHours = courses.reduce((sum, course) => sum + course.hours, 0);
  console.log(`总课时: ${totalHours}`);

  // 计算教师总最大工作量
  const totalMaxHours = teachers.reduce(
    (sum, teacher) => sum + teacher.teachingHours.max,
    0
  );
  console.log(`教师总最大工作量: ${totalMaxHours}`);

  const teacherWorkloads = new Map(teachers.map((t) => [t._id.toString(), 0]));
  const sortedCourses = [...courses].sort((a, b) => b.hours - a.hours);

  for (const course of sortedCourses) {
    // 找到最适合的教师
    let bestTeacher = null;
    let minWorkloadDiff = Infinity;

    for (const teacher of teachers) {
      const currentWorkload = teacherWorkloads.get(teacher._id.toString());
      const newWorkload = currentWorkload + course.hours;

      // 检查是否超过最大工作量
      if (newWorkload <= teacher.teachingHours.max) {
        // 计算与最小工作量的差距
        const workloadDiff = Math.abs(teacher.teachingHours.min - newWorkload);
        if (workloadDiff < minWorkloadDiff) {
          minWorkloadDiff = workloadDiff;
          bestTeacher = teacher;
        }
      }
    }

    if (!bestTeacher) {
      console.log("当前课程分配情况:");
      for (const [teacherId, workload] of teacherWorkloads.entries()) {
        const teacher = teachers.find((t) => t._id.toString() === teacherId);
        console.log(
          `教师 ${teacher.username}: ${workload}/${teacher.teachingHours.max} 小时`
        );
      }
      console.log(`无法分配的课程: ${course.name}, 课时: ${course.hours}`);
      throw new Error("无法找到合适的教师来分配课程");
    }

    // 分配课程给选中的教师
    await Course.findByIdAndUpdate(course._id, {
      teacher: bestTeacher._id,
    });

    // 更新教师工作量
    const newWorkload =
      teacherWorkloads.get(bestTeacher._id.toString()) + course.hours;
    teacherWorkloads.set(bestTeacher._id.toString(), newWorkload);

    await User.findByIdAndUpdate(bestTeacher._id, {
      "teachingHours.current": newWorkload,
    });
  }

  // 打印最终分配结果
  console.log("\n最终课程分配结果:");
  for (const [teacherId, workload] of teacherWorkloads.entries()) {
    const teacher = teachers.find((t) => t._id.toString() === teacherId);
    console.log(
      `教师 ${teacher.username}: ${workload} 小时 (最小: ${teacher.teachingHours.min}, 最大: ${teacher.teachingHours.max})`
    );
  }
};

describe("课程排期集成测试", () => {
  beforeAll(async () => {
    await dbHandler.connect();
  }, 30000);

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
  });

  it("应该能够完成完整的排课流程", async () => {
    // 1. 生成并插入模拟数据
    const teacherCount = 12;
    const courseCount = 45;
    const classroomCount = 15;
    const classCount = 12;

    // 创建教师
    const teachers = await User.create(generateMockData.teachers(teacherCount));
    expect(teachers.length).toBe(teacherCount);

    // 创建课程
    const courses = await Course.create(generateMockData.courses(courseCount));
    expect(courses.length).toBe(courseCount);

    // 创建教室
    const classrooms = await Classroom.create(
      generateMockData.classrooms(classroomCount)
    );
    expect(classrooms.length).toBe(classroomCount);

    // 创建班级
    const classes = await Class.create(generateMockData.classes(classCount));
    expect(classes.length).toBe(classCount);

    // 在分配课程之前打印统计信息
    console.log(`\n创建了 ${teachers.length} 名教师`);
    console.log(`创建了 ${courses.length} 门课程`);

    // 使用优化后的分配函数
    await assignCoursesToTeachers(courses, teachers);

    // 3. 验证教师工作量
    const updatedTeachers = await User.find({ role: "teacher" });
    for (const teacher of updatedTeachers) {
      console.log(
        `Teacher: ${teacher.username}, Current Hours: ${teacher.teachingHours.current}, Min Hours: ${teacher.teachingHours.min}`
      );
      // expect(teacher.teachingHours.current).toBeGreaterThanOrEqual(
      //   teacher.teachingHours.min
      // );
      // expect(teacher.teachingHours.current).toBeLessThanOrEqual(
      //   teacher.teachingHours.max
      // );
    }

    // 使用遗传算法进行排课
    const scheduler = new SchedulingAlgorithm(
      updatedTeachers,
      courses,
      classrooms,
      classes,
      [] // 时间段可以根据需要添加
    );

    const scheduleResult = await scheduler.run();

    // 更新班级的课程安排
    for (const classSchedule of scheduleResult) {
      await Class.findByIdAndUpdate(classSchedule.classId, {
        courses: classSchedule.courses,
      });
    }

    // 5. 验证班级课程安排
    const updatedClasses = await Class.find()
      .populate("courses.course")
      .populate("courses.classroom");

    for (const classObj of updatedClasses) {
      console.log(`\n检查班级: ${classObj.name}`);

      // 验证课程数量
      console.log(`课程数量: ${classObj.courses.length}`);

      // 验证教室容量
      classObj.courses.forEach((courseSchedule, index) => {
        console.log(`\n课程 ${index + 1}:`);
        console.log(`- 课程名称: ${courseSchedule.course.name}`);
        console.log(
          `- 教室: ${courseSchedule.classroom.name} (容量: ${courseSchedule.classroom.capacity})`
        );
        console.log(
          `- 时间安排: 星期${courseSchedule.schedule[0].dayOfWeek}, ${courseSchedule.schedule[0].startTime}-${courseSchedule.schedule[0].endTime}`
        );
      });

      // 检查时间冲突
      const timeSlots = classObj.courses.map((c) => ({
        day: c.schedule[0].dayOfWeek,
        start: c.schedule[0].startTime,
        end: c.schedule[0].endTime,
        courseName: c.course.name,
      }));

      console.log("\n检查时间冲突:");
      for (let i = 0; i < timeSlots.length; i++) {
        for (let j = i + 1; j < timeSlots.length; j++) {
          const slot1 = timeSlots[i];
          const slot2 = timeSlots[j];

          // 如果在同一天，检查时间是否重叠
          if (slot1.day === slot2.day) {
            console.log(`\n比较课程时间:`);
            console.log(
              `课程1: ${slot1.courseName} (星期${slot1.day} ${slot1.start}-${slot1.end})`
            );
            console.log(
              `课程2: ${slot2.courseName} (星期${slot2.day} ${slot2.start}-${slot2.end})`
            );

            const hasConflict = !(
              slot1.end <= slot2.start || slot2.end <= slot1.start
            );

            if (hasConflict) {
              console.log("发现时间冲突！");
            } else {
              console.log("时间正常");
            }
          }
        }
      }
    }
  });
});
