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
  mockScheduleTemplates
);
const results = scheduler.schedule();

console.log(results);
