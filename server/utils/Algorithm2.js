/**
 * 课程时间槽类型定义
 * @typedef {Object} TimeSlot
 * @property {string} day - 周几 (1-5)
 * @property {string} period - 第几节课
 * @property {string} startTime - 开始时间
 * @property {string} endTime - 结束时间
 * @property {number} creditHours - 学时数
 */

/**
 * 排课结果类型定义
 * @typedef {Object} ScheduleResult
 * @property {string} courseId - 课程ID
 * @property {string} classId - 班级ID
 * @property {string} teacherId - 教师ID
 * @property {TimeSlot} timeSlot - 时间槽
 * @property {number[]} weeks - 周次数组
 */

class SchedulingAlgorithm {
  constructor(mockClasses, mockCourses, mockUsers, mockScheduleTemplates) {
    // 初始化数据
    this.classes = mockClasses;
    this.courses = mockCourses;
    this.teachers = mockUsers.filter((user) => user.roles.includes("teacher"));
    this.scheduleTemplate = mockScheduleTemplates[0];

    // 初始化时间槽
    this.timeSlots = this.initializeTimeSlots();

    // 初始化结果数组
    this.scheduleResults = [];
  }

  /**
   * 初始化可用时间槽
   * @returns {TimeSlot[]}
   */
  initializeTimeSlots() {
    const slots = [];
    const days = ["1", "2", "3", "4", "5"]; // 周一到周五

    // 遍历每一天
    days.forEach((day) => {
      // 上午时间段
      this.scheduleTemplate.periods.morning.forEach((period) => {
        slots.push({
          day,
          period: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          creditHours: period.creditHours,
        });
      });

      // 下午时间段
      this.scheduleTemplate.periods.afternoon.forEach((period) => {
        slots.push({
          day,
          period: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          creditHours: period.creditHours,
        });
      });

      // 晚上时间段
      this.scheduleTemplate.periods.evening.forEach((period) => {
        slots.push({
          day,
          period: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          creditHours: period.creditHours,
        });
      });
    });

    return slots;
  }

  /**
   * 检查时间冲突
   * @param {ScheduleResult} schedule - 待检查的排课结果
   * @returns {boolean} 是否存在冲突
   */
  checkConflict(schedule) {
    // 检查教师在该时间段是否已有课程
    const teacherConflict = this.scheduleResults.some(
      (result) =>
        result.teacherId === schedule.teacherId &&
        result.timeSlot.day === schedule.timeSlot.day &&
        result.timeSlot.period === schedule.timeSlot.period &&
        this.hasWeekOverlap(result.weeks, schedule.weeks)
    );

    // 检查班级在该时间段是否已有课程
    const classConflict = this.scheduleResults.some(
      (result) =>
        result.classId === schedule.classId &&
        result.timeSlot.day === schedule.timeSlot.day &&
        result.timeSlot.period === schedule.timeSlot.period &&
        this.hasWeekOverlap(result.weeks, schedule.weeks)
    );

    return teacherConflict || classConflict;
  }

  /**
   * 检查两个周次数组是否有重叠
   * @param {number[]} weeks1
   * @param {number[]} weeks2
   * @returns {boolean}
   */
  hasWeekOverlap(weeks1, weeks2) {
    return weeks1.some((week) => weeks2.includes(week));
  }

  /**
   * 获取课程的周次数组
   * @param {Object} course
   * @returns {number[]}
   */
  getCourseWeeks(course) {
    const weeks = [];
    for (let i = course.weeks.start; i <= course.weeks.end; i++) {
      weeks.push(i);
    }
    return weeks;
  }

  /**
   * 主排课算法
   * @returns {ScheduleResult[]}
   */
  schedule() {
    // 按优先级对课程进行排序
    const sortedCourses = this.prioritizeCourses();

    // 遍历每门课程进行排课
    sortedCourses.forEach((course) => {
      this.scheduleCourse(course);
    });

    return this.scheduleResults;
  }

  /**
   * 课程优先级排序
   * @returns {Object[]}
   */
  prioritizeCourses() {
    return this.courses.sort((a, b) => {
      // 1. 首先按课时数降序
      if (b.hours !== a.hours) {
        return b.hours - a.hours;
      }
      // 2. 其次按班级数量降序
      if (b.classes.length !== a.classes.length) {
        return b.classes.length - a.classes.length;
      }
      // 3. 最后按周次跨度降序
      const aSpan = a.weeks.end - a.weeks.start;
      const bSpan = b.weeks.end - b.weeks.start;
      return bSpan - aSpan;
    });
  }

  /**
   * 为单门课程安排时间
   * @param {Object} course
   */
  scheduleCourse(course) {
    // 获取课程周次
    const weeks = this.getCourseWeeks(course);

    // 获取每周所需课时数
    const weeklyHours = course.hours;

    // 计算需要安排的课程数量
    const lessonsPerWeek = weeklyHours / 2; // 因为每个时间槽是2学时

    // 为每个班级安排课程
    course.classes.forEach((classId) => {
      // 获取可用的时间槽
      const availableSlots = this.getAvailableSlots(
        course,
        classId,
        lessonsPerWeek
      );

      // 安排课程
      for (let i = 0; i < lessonsPerWeek; i++) {
        if (availableSlots[i]) {
          this.scheduleResults.push({
            courseId: course._id.$oid,
            classId: classId.$oid,
            teacherId: course.teacher.$oid,
            timeSlot: availableSlots[i],
            weeks,
          });
        }
      }
    });
  }

  /**
   * 获取可用的时间槽
   * @param {Object} course
   * @param {Object} classId
   * @param {number} count
   * @returns {TimeSlot[]}
   */
  getAvailableSlots(course, classId, count) {
    const availableSlots = [];
    const weeks = this.getCourseWeeks(course);

    // 遍历所有时间槽
    for (const slot of this.timeSlots) {
      // 创建临时排课结果用于冲突检查
      const tempSchedule = {
        courseId: course._id.$oid,
        classId: classId.$oid,
        teacherId: course.teacher.$oid,
        timeSlot: slot,
        weeks,
      };

      // 如果没有冲突且符合课程分布要求
      if (
        !this.checkConflict(tempSchedule) &&
        this.checkDistribution(availableSlots, slot)
      ) {
        availableSlots.push(slot);

        // 如果已经找到足够的时间槽
        if (availableSlots.length === count) {
          break;
        }
      }
    }

    return availableSlots;
  }

  /**
   * 检查课程分布是否合理
   * @param {TimeSlot[]} existingSlots
   * @param {TimeSlot} newSlot
   * @returns {boolean}
   */
  checkDistribution(existingSlots, newSlot) {
    // 检查是否存在相邻天数的课程
    return !existingSlots.some(
      (slot) => Math.abs(Number(slot.day) - Number(newSlot.day)) <= 1
    );
  }
}

module.exports = SchedulingAlgorithm;
