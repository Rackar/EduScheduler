// 导入mock数据
const mockClasses = require("./converted_class.json");
const mockCourses = require("./converted_course.json");
const mockUsers = require("./converted_users.json");
const mockScheduleTemplates = require("./converted_scheduletemplates.json");
const SchedulingAlgorithm = require("../utils/Algorithm2");

const scheduler = new SchedulingAlgorithm(
  mockClasses,
  mockCourses,
  mockUsers,
  mockScheduleTemplates,
  { allowAlternateWeeks: true }
);
const results = scheduler.schedule();

console.log(results);

let testCourses = results.filter(
  (item) => item.courseId === "6751d3fd9fc1cc6a9cc21479"
);
console.log(testCourses);
