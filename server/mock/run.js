// 导入mock数据
const mockClasses = require("./class.json");
const mockCourses = require("./course.json");
const mockUsers = require("./users.json");
const mockScheduleTemplates = require("./scheduletemplates.json");
const SchedulingAlgorithm = require("../utils/Algorithm2");

const scheduler = new SchedulingAlgorithm(
  mockClasses,
  mockCourses,
  mockUsers,
  mockScheduleTemplates,
  { allowAlternateWeeks: true }
);
const results = scheduler.schedule();

// console.log(results);

let testCourses = results.filter(
  (item) => item.courseId === "6751d3fd9fc1cc6a9cc21479"
);
console.log(testCourses);
