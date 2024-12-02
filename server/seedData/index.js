const mongoose = require("mongoose");
const User = require("../models/User");
const Course = require("../models/Course");
const Classroom = require("../models/Classroom");
const Class = require("../models/Class");
const TimeSlot = require("../models/TimeSlot");

const seedData = {
  // 用户数据
  users: [
    {
      username: "admin",
      password: "admin123",
      role: "superAdmin",
    },
    {
      username: "scheduler1",
      password: "scheduler123",
      role: "scheduler",
    },
    {
      username: "teacher1",
      password: "teacher123",
      role: "teacher",
      department: "数学系",
      teachingHours: {
        current: 0,
        min: 14,
        max: 16,
      },
    },
    {
      username: "teacher2",
      password: "teacher123",
      role: "teacher",
      department: "物理系",
      teachingHours: {
        current: 0,
        min: 14,
        max: 16,
      },
    },
  ],

  // 课程数据
  courses: [
    {
      name: "高等数学",
      department: "数学系",
      hours: 4,
      status: "available",
      semester: "2024春季",
    },
    {
      name: "线性代数",
      department: "数学系",
      hours: 3,
      status: "available",
      semester: "2024春季",
    },
    {
      name: "大学物理",
      department: "物理系",
      hours: 4,
      status: "available",
      semester: "2024春季",
    },
  ],

  // 教室数据
  classrooms: [
    {
      name: "教101",
      capacity: 60,
      location: "教学楼A",
      resources: ["projector", "whiteboard"],
    },
    {
      name: "教102",
      capacity: 45,
      location: "教学楼A",
      resources: ["projector", "whiteboard"],
    },
    {
      name: "教103",
      capacity: 80,
      location: "教学楼A",
      resources: ["projector", "whiteboard", "computer"],
    },
  ],

  // 班级数据
  classes: [
    {
      name: "计算机2024-1班",
      grade: "2024",
      department: "计算机系",
      academicYear: "2024-2025",
      studentCount: 30,
      status: "active",
    },
    {
      name: "软件2024-1班",
      grade: "2024",
      department: "软件工程系",
      academicYear: "2024-2025",
      studentCount: 35,
      status: "active",
    },
  ],

  // 时间段数据
  timeSlots: [
    {
      name: "第一节",
      startTime: "08:00",
      endTime: "08:45",
      type: "morning",
      order: 1,
      breakTime: { duration: 10 },
    },
    {
      name: "第二节",
      startTime: "08:55",
      endTime: "09:40",
      type: "morning",
      order: 2,
      breakTime: { duration: 20, isLongBreak: true },
    },
    {
      name: "第三节",
      startTime: "10:00",
      endTime: "10:45",
      type: "morning",
      order: 3,
      breakTime: { duration: 10 },
    },
    {
      name: "第四节",
      startTime: "10:55",
      endTime: "11:40",
      type: "morning",
      order: 4,
      breakTime: { duration: 120 },
    },
  ],
};

module.exports = seedData;
