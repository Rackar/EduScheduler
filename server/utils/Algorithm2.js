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

      // 存储处理后的每
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
    // 如果是1个学时，特殊处理
    if (hours === 1) {
      return {
        periodsPerWeek: 1,
        isAlternate: false,
        isSinglePeriod: true, // 标记为单节课
      };
    }

    // 如果不允许单双周,向上取整
    if (!this.options.allowAlternateWeeks) {
      return {
        periodsPerWeek: Math.ceil(hours / 2), // 每周课时数(向上取整)
        isAlternate: false,
        isSinglePeriod: false,
      };
    }

    // 允许单双周且是1.5的倍数
    if (hours % 3 === 0) {
      return {
        evenWeek: Math.floor(hours / 2), // 双周课时
        oddWeek: Math.ceil(hours / 2), // 单周课时
        isAlternate: true,
        isSinglePeriod: false,
      };
    }

    // 其他情况仍然向上取整
    return {
      periodsPerWeek: Math.ceil(hours / 2),
      isAlternate: false,
      isSinglePeriod: false,
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
      // 上午间段
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
   * @param {Array} weeks1 - 第一个周次数组
   * @param {Array} weeks2 - 第二个周次数组
   * @returns {boolean} 是否有重叠
   */
  hasWeekOverlap(weeks1, weeks2) {
    if (!Array.isArray(weeks1) || !Array.isArray(weeks2)) {
      console.warn("周次数据无效:", { weeks1, weeks2 });
      return false;
    }

    // 如果任一数组为空，视为无重叠
    if (weeks1.length === 0 || weeks2.length === 0) {
      return false;
    }

    // 处理周次范围
    const expandWeeks = (weeks) => {
      if (weeks.length === 2 && weeks[0] < weeks[1]) {
        // 如果是范围格式 [start, end]
        const expanded = [];
        for (let i = weeks[0]; i <= weeks[1]; i++) {
          expanded.push(i);
        }
        return expanded;
      }
      return weeks;
    };

    const expandedWeeks1 = expandWeeks(weeks1);
    const expandedWeeks2 = expandWeeks(weeks2);

    // 检查是否有任何重叠的周次
    return expandedWeeks1.some((week) => expandedWeeks2.includes(week));
  }

  /**
   * 获取课程的周次数组
   * @param {Object} course
   * @param {number} slotIndex - 第几个时间槽(0开始)
   * @returns {number[]}
   */
  getCourseWeeks(course, slotIndex = 0) {
    // 如果是单节课，只返回最后一周
    if (course.processedHours?.isSinglePeriod) {
      return [course.weeks.end];
    }

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

    // 后处理优化：合并单双周课程
    this.optimizeAlternateWeeks();

    return this.scheduleResults;
  }

  /**
   * 后处理优化：合并单双周课程到同一天
   * 遍历所有课程，尝试将单双周课程合并到同一天的同一���间段
   */
  optimizeAlternateWeeks() {
    // 按课程ID分组
    const courseGroups = new Map();
    this.scheduleResults.forEach((schedule) => {
      if (!courseGroups.has(schedule.courseId)) {
        courseGroups.set(schedule.courseId, []);
      }
      courseGroups.get(schedule.courseId).push(schedule);
    });

    // 遍历每个课程组
    courseGroups.forEach((schedules, courseId) => {
      if (schedules.length <= 1) return;

      // 找到可能的单双周课程
      const oddWeekSchedules = schedules.filter((s) =>
        s.weeks.every((w) => w % 2 === 1)
      );
      const evenWeekSchedules = schedules.filter((s) =>
        s.weeks.every((w) => w % 2 === 0)
      );

      // 如果存在单双周课程
      if (oddWeekSchedules.length > 0 && evenWeekSchedules.length > 0) {
        oddWeekSchedules.forEach((oddSchedule) => {
          // 尝试为每个单周课程找到合适的双周课程进行合并
          const suitableEvenSchedule = this.findSuitableScheduleForMerge(
            oddSchedule,
            evenWeekSchedules
          );

          if (suitableEvenSchedule) {
            // 将双周课程移动到单周课程的时间槽
            const newSchedule = {
              ...suitableEvenSchedule,
              timeSlot: oddSchedule.timeSlot,
              timeSlotId: oddSchedule.timeSlotId,
              dayOfWeek: oddSchedule.dayOfWeek,
            };

            // 检查移动后是否会产生冲突
            if (!this.checkConflict(newSchedule)) {
              // 更新课程安排
              const index = this.scheduleResults.findIndex(
                (s) => s === suitableEvenSchedule
              );
              if (index !== -1) {
                this.scheduleResults[index] = newSchedule;
              }
            }
          }
        });
      }
    });
  }

  /**
   * 为给定的课程安排找到合适的配对进行合并
   * @param {ScheduleResult} schedule - 待配对的课程安排
   * @param {ScheduleResult[]} candidates - 候选课程安排
   * @returns {ScheduleResult|null} 合适的配对课程，如果没有则返回null
   */
  findSuitableScheduleForMerge(schedule, candidates) {
    // 检查每个候选课程
    for (const candidate of candidates) {
      // 必须是同一个班级
      if (candidate.classId !== schedule.classId) continue;

      // 必须是同一个教师
      if (candidate.teacherId !== schedule.teacherId) continue;

      // 检查合并后是否会产生时间冲突
      const tempSchedule = {
        ...candidate,
        timeSlot: schedule.timeSlot,
        timeSlotId: schedule.timeSlotId,
        dayOfWeek: schedule.dayOfWeek,
      };

      if (!this.checkConflict(tempSchedule)) {
        return candidate;
      }
    }

    return null;
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
      // 3. 最后按周次度降序
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
      // 如果是单节课，只安排一次
      if (course.processedHours?.isSinglePeriod) {
        const availableSlots = this.getAvailableSlots(course, classId, 1);
        if (availableSlots.length > 0) {
          this.scheduleResults.push({
            courseId: course._id.toString(),
            classId: classId.toString(),
            teacherId: course.teacher._id.toString(),
            timeSlot: availableSlots[0],
            timeSlotId: availableSlots[0].id,
            dayOfWeek: availableSlots[0].day,
            courseName: course.name,
            weeks: this.getCourseWeeks(course),
          });
        }
        return;
      }

      if (course.processedHours?.isAlternate) {
        // 先安排单周课程
        const oddWeekSlots = this.getAvailableSlots(
          course,
          classId,
          course.processedHours.oddWeek
        );

        // 记录单周课程的时间槽
        const oddWeekSchedules = [];
        oddWeekSlots.forEach((slot) => {
          const schedule = {
            courseId: course._id.toString(),
            classId: classId.toString(),
            teacherId: course.teacher._id.toString(),
            timeSlot: slot,
            timeSlotId: slot.id,
            dayOfWeek: slot.day,
            courseName: course.name,
            weeks: this.getCourseWeeks(course, 0), // 单周
          };
          this.scheduleResults.push(schedule);
          oddWeekSchedules.push(schedule);
        });

        // 尝试在单周课程的时间安排双周课程
        const evenWeekSlots = oddWeekSchedules.map(
          (schedule) => schedule.timeSlot
        );
        if (evenWeekSlots.length >= course.processedHours.evenWeek) {
          // 可以复用时间槽
          evenWeekSlots
            .slice(0, course.processedHours.evenWeek)
            .forEach((slot) => {
              this.scheduleResults.push({
                courseId: course._id.toString(),
                classId: classId.toString(),
                teacherId: course.teacher._id.toString(),
                timeSlot: slot,
                timeSlotId: slot.id,
                dayOfWeek: slot.day,
                courseName: course.name,
                weeks: this.getCourseWeeks(course, 1), // 双周
              });
            });
        } else {
          // 需要寻找新的时间槽，优先考虑已有课程的时间段
          const additionalSlots = this.getAvailableSlots(
            course,
            classId,
            course.processedHours.evenWeek - evenWeekSlots.length,
            oddWeekSchedules
          );

          additionalSlots.forEach((slot) => {
            this.scheduleResults.push({
              courseId: course._id.toString(),
              classId: classId.toString(),
              teacherId: course.teacher._id.toString(),
              timeSlot: slot,
              timeSlotId: slot.id,
              dayOfWeek: slot.day,
              courseName: course.name,
              weeks: this.getCourseWeeks(course, 1), // 双周
            });
          });
        }
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
            timeSlotId: slot.id,
            dayOfWeek: slot.day,
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
   * @param {Array} existingSchedules - 已有的课程安排
   * @returns {TimeSlot[]}
   */
  getAvailableSlots(course, classId, count, existingSchedules = []) {
    const availableSlots = [];
    const weeks = this.getCourseWeeks(course);

    // 先检查已有课程的时间槽
    const existingDays = new Set();
    existingSchedules?.forEach((schedule) => {
      existingDays.add(schedule.timeSlot.day);
    });

    // 遍历所有时间槽
    for (const slot of this.timeSlots) {
      // 如果是已有课程的时间槽，优先考虑
      const isExistingDay = existingDays.has(slot.day);

      // 创建临时排课结果用于冲突检查
      const tempSchedule = {
        courseId: course._id.toString(),
        classId: classId.toString(),
        teacherId: course.teacher._id.toString(),
        timeSlot: slot,
        timeSlotId: slot.id,
        dayOfWeek: slot.day,
        weeks,
      };

      // 如果没有冲突且符合课程分布要求
      if (
        !this.checkConflict(tempSchedule) &&
        this.checkDistribution(availableSlots, slot, existingSchedules)
      ) {
        // 如果是已有课程的时间槽，插入到数组前面
        if (isExistingDay) {
          availableSlots.unshift(slot);
        } else {
          availableSlots.push(slot);
        }

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
   * @param {Array} existingSchedules - 已有的课程安排
   * @returns {boolean}
   */
  checkDistribution(existingSlots, newSlot, existingSchedules = []) {
    // 检查相邻天数
    const hasAdjacentDay = existingSlots.some(
      (slot) => Math.abs(Number(slot.day) - Number(newSlot.day)) <= 1
    );

    if (hasAdjacentDay) return false;

    // 检查单双周分布
    const dayCount = new Map();

    // 统计现有时间槽的每天课程数
    existingSlots.forEach((slot) => {
      const day = slot.day;
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    });

    // 统计已有课程安排的每天课程数
    existingSchedules.forEach((schedule) => {
      const day = schedule.timeSlot.day;
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    });

    // 如果某天已有��程，不允许再安排
    if (dayCount.get(newSlot.day)) return false;

    // 检查是否超过每天最大课程数
    const currentDayCount = dayCount.get(newSlot.day) || 0;
    if (currentDayCount >= this.options.maxCoursesPerDay) return false;

    return true;
  }

  checkConflicts(schedule, targetDay, timeSlot) {
    const targetDaySchedules = this.dailySchedules[targetDay];

    // 添加调试日志
    console.log("检查冲突:", {
      schedule: {
        id: schedule._id,
        teacherId: schedule.teacherId,
        classId: schedule.classId,
        timeSlotId: schedule.timeSlotId,
        weeks: schedule.weeks,
      },
      targetDay,
      timeSlot,
      targetDaySchedulesCount: targetDaySchedules.length,
    });

    // 检查教师冲突
    if (schedule.teacherId) {
      const teacherConflict = targetDaySchedules.some((s) => {
        const isConflict =
          s.teacherId &&
          s.teacherId.toString() === schedule.teacherId.toString() &&
          s.timeSlotId === schedule.timeSlotId &&
          s._id !== schedule._id && // 排除自身
          this.hasWeekOverlap(s.weeks, schedule.weeks); // 添加周次重叠检查

        if (isConflict) {
          console.log("发现教师冲突:", {
            sourceTeacher: schedule.teacherId.toString(),
            targetTeacher: s.teacherId.toString(),
            sourceTimeSlot: schedule.timeSlotId,
            targetTimeSlot: s.timeSlotId,
            sourceWeeks: schedule.weeks,
            targetWeeks: s.weeks,
          });
        }
        return isConflict;
      });
      if (teacherConflict) return true;
    }

    // 检查班级冲突
    if (schedule.classId) {
      const classConflict = targetDaySchedules.some((s) => {
        const isConflict =
          s.classId &&
          s.classId.toString() === schedule.classId.toString() &&
          s.timeSlotId === schedule.timeSlotId &&
          s._id !== schedule._id && // 排除自身
          this.hasWeekOverlap(s.weeks, schedule.weeks); // 添加周次重叠检查

        if (isConflict) {
          console.log("发现班级冲突:", {
            sourceClass: schedule.classId.toString(),
            targetClass: s.classId.toString(),
            sourceTimeSlot: schedule.timeSlotId,
            targetTimeSlot: s.timeSlotId,
            sourceWeeks: schedule.weeks,
            targetWeeks: s.weeks,
          });
        }
        return isConflict;
      });
      if (classConflict) return true;
    }

    // 检查班级每日课程数限制
    if (schedule.classId) {
      const classScheduleCount = targetDaySchedules.filter(
        (s) =>
          s.classId &&
          s.classId._id.toString() === schedule.classId._id.toString()
      ).length;

      if (classScheduleCount >= this.options.maxDailyLessons) {
        console.log("超出班级每日课程数限制:", {
          classId: schedule.classId.toString(),
          current: classScheduleCount,
          max: this.options.maxDailyLessons,
        });
        return true;
      }
    }

    // 检查连续课程限制
    if (schedule.teacherId) {
      const consecutiveCount = targetDaySchedules.filter((s) => {
        const isConsecutive =
          s.teacherId &&
          s.teacherId.toString() === schedule.teacherId.toString() &&
          Math.abs(parseInt(s.timeSlotId) - parseInt(schedule.timeSlotId)) ===
            1 &&
          s._id !== schedule._id && // 排除自身
          this.hasWeekOverlap(s.weeks, schedule.weeks); // 添加周次重叠检查

        if (isConsecutive) {
          console.log("发现连续课程:", {
            sourceTimeSlot: schedule.timeSlotId,
            targetTimeSlot: s.timeSlotId,
            difference: Math.abs(
              parseInt(s.timeSlotId) - parseInt(schedule.timeSlotId)
            ),
            sourceWeeks: schedule.weeks,
            targetWeeks: s.weeks,
          });
        }
        return isConsecutive;
      }).length;

      if (consecutiveCount >= this.options.maxConsecutive) {
        console.log("超出连续课程限制:", {
          count: consecutiveCount,
          max: this.options.maxConsecutive,
        });
        return true;
      }
    }

    return false;
  }
}

module.exports = SchedulingAlgorithm;
