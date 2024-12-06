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

/**
 * 排课算法类
 */
class SchedulingAlgorithm {
  /**
   * 构造函数
   * @param {Object[]} mockClasses - 班级数据
   * @param {Object[]} mockCourses - 课程数据
   * @param {Object[]} mockUsers - 用户数据
   * @param {Object} mockScheduleTemplates - 排课模板数据
   * @param {Object} options - 配置选项
   */
  constructor(
    mockClasses,
    mockCourses,
    mockUsers,
    mockScheduleTemplates,
    options = {}
  ) {
    // 初始化数据
    this.classes = mockClasses;
    this.courses = mockCourses;
    this.teachers = mockUsers.filter((user) => user.roles.includes("teacher"));
    this.scheduleTemplate = mockScheduleTemplates;

    // 配置选项,设置默认值
    this.options = {
      // 是否允许单双周排课(处理1.5节这种情况)
      allowAlternateWeeks: options.allowAlternateWeeks || false,

      // 是否允许连续上课(默认同一课程至少隔一天)
      allowConsecutivePeriods: options.allowConsecutivePeriods || false,

      // 每天最大课程数
      maxCoursesPerDay: options.maxCoursesPerDay || 4,
    };

    // 初始化时间槽
    this.timeSlots = this.initializeTimeSlots();

    // 初始化结果数组
    this.scheduleResults = [];

    // 初始化课程周次分配
    this.courseWeeklySlots = new Map(); // 记录每门课每周的时间段分配

    // 验证和处理课时
    this.validateAndProcessHours();

    console.log("初始化排课算法:", {
      coursesCount: this.courses.length,
      timeSlotsCount: this.timeSlots.length,
      options: this.options,
    });
  }

  /**
   * 验证和处理课时分配
   * 处理1.5节课这种特殊情况
   */
  validateAndProcessHours() {
    this.courses.forEach((course) => {
      const weeklyHours = course.hours;
      const processedHours = this.processWeeklyHours(weeklyHours);

      // 存储处理后的每周课时数
      course.processedHours = processedHours;

      console.log(`课程 ${course.name} 处理结果:`, {
        original: weeklyHours,
        processed: processedHours,
      });
    });
  }

  /**
   * 处理周课时数
   * @param {number} hours - 原始周课时数
   * @returns {Object} 处理后的课时安排
   */
  processWeeklyHours(hours) {
    // 如果不允许单双周,向上取整
    if (!this.options.allowAlternateWeeks) {
      return {
        periodsPerWeek: Math.ceil(hours / 2), // 每周课时数(向上取整)
        isAlternate: false,
      };
    }

    // 允许单双周且是1.5的倍数
    if (hours % 3 === 0) {
      return {
        evenWeek: Math.floor(hours / 2), // 双周课时
        oddWeek: Math.ceil(hours / 2), // 单周课时
        isAlternate: true,
      };
    }

    // 其他情况仍然向上取整
    return {
      periodsPerWeek: Math.ceil(hours / 2),
      isAlternate: false,
    };
  }

  /**
   * 检查是否可以在指定日期安排课程
   * @param {Object} course - 课程信息
   * @param {number} day - 星期几
   * @returns {boolean}
   */
  canScheduleOnDay(course, day) {
    // 获取该天已安排的课程数
    const coursesOnDay = this.scheduleResults.filter(
      (schedule) => schedule.timeSlot.day === day
    ).length;

    // 检查是否超过每天最大课程数
    if (coursesOnDay >= this.options.maxCoursesPerDay) {
      return false;
    }

    // 如果不允许连续上课,检查前后天是否有同一门课
    if (!this.options.allowConsecutivePeriods) {
      const hasAdjacentDay = this.scheduleResults.some(
        (schedule) =>
          schedule.courseId === course._id.toString() &&
          Math.abs(Number(schedule.timeSlot.day) - Number(day)) <= 1
      );

      if (hasAdjacentDay) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取课程在指定周的课时数
   * @param {Object} course - 课程信息
   * @param {number} week - 周次
   * @returns {number} 课时数
   */
  getPeriodsForWeek(course, week) {
    if (!course.processedHours.isAlternate) {
      return course.processedHours.periodsPerWeek;
    }

    // 单双周区分处理
    return week % 2 === 0
      ? course.processedHours.evenWeek
      : course.processedHours.oddWeek;
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
      this.scheduleTemplate.periods.morning?.forEach((period) => {
        slots.push({
          day,
          period: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          creditHours: period.creditHours,
          id: period._id.toString(),
        });
      });

      // 下午时间段
      this.scheduleTemplate.periods.afternoon?.forEach((period) => {
        slots.push({
          day,
          period: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          creditHours: period.creditHours,
          id: period._id.toString(),
        });
      });

      // 晚上时间段
      this.scheduleTemplate.periods.evening?.forEach((period) => {
        slots.push({
          day,
          period: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          creditHours: period.creditHours,
          id: period._id.toString(),
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
   * @param {number} slotIndex - 第几个时间槽(0开始)
   * @returns {number[]}
   */
  getCourseWeeks(course, slotIndex = 0) {
    const weeks = [];
    const { start, end } = course.weeks;

    // 如果不是单双周课程,返回所有周次
    if (!course.processedHours?.isAlternate) {
      for (let i = start; i <= end; i++) {
        weeks.push(i);
      }
      return weeks;
    }

    // 单双周处理
    for (let i = start; i <= end; i++) {
      // 第一个时间槽在单周上课(多课时)
      if (slotIndex === 0) {
        if (i % 2 === 1) {
          // 单周
          weeks.push(i);
        }
      }
      // 第二个时间槽在双周上课(少课时)
      else if (slotIndex === 1) {
        if (i % 2 === 0) {
          // 双周
          weeks.push(i);
        }
      }
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
    // 获取每周所需课时数
    const weeklyHours = course.hours;

    // 为每个班级安排课程
    course.classes.forEach((classId) => {
      if (course.processedHours?.isAlternate) {
        // 单双周排课
        // 1. 单周课时(多)
        const oddWeekSlots = this.getAvailableSlots(
          course,
          classId,
          course.processedHours.oddWeek
        );

        // 2. 双周课时(少)
        const evenWeekSlots = this.getAvailableSlots(
          course,
          classId,
          course.processedHours.evenWeek
        );

        // 安排单周课程
        oddWeekSlots.forEach((slot, index) => {
          this.scheduleResults.push({
            courseId: course._id.toString(),
            classId: classId.toString(),
            teacherId: course.teacher._id.toString(),
            timeSlot: slot,
            courseName: course.name,
            weeks: this.getCourseWeeks(course, 0), // 单周
          });
        });

        // 安排双周课程
        evenWeekSlots.forEach((slot, index) => {
          this.scheduleResults.push({
            courseId: course._id.toString(),
            classId: classId.toString(),
            teacherId: course.teacher._id.toString(),
            timeSlot: slot,
            courseName: course.name,
            weeks: this.getCourseWeeks(course, 1), // 双周
          });
        });
      } else {
        // 常规排课(每周相同)
        const lessonsPerWeek = weeklyHours / 2;
        const availableSlots = this.getAvailableSlots(
          course,
          classId,
          lessonsPerWeek
        );

        availableSlots.forEach((slot) => {
          this.scheduleResults.push({
            courseId: course._id.toString(),
            classId: classId.toString(),
            teacherId: course.teacher._id.toString(),
            timeSlot: slot,
            courseName: course.name,
            weeks: this.getCourseWeeks(course), // 所有周次
          });
        });
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
        courseId: course._id.toString(),
        classId: classId.toString(),
        teacherId: course.teacher._id.toString(),
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
