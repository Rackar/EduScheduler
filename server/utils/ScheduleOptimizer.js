const Schedule2 = require("../models/Schedule2");

/**
 * 课表优化器类
 * 使用局部搜索算法优化课程分布
 */
class ScheduleOptimizer {
  /**
   * 构造函数
   * @param {Array} schedules - 课表数据
   * @param {Object} options - 优化选项
   */
  constructor(schedules, options = {}) {
    this.schedules = schedules;
    this.options = {
      maxIterations: options.maxIterations || 1000, // 最大迭代次数
      targetBalance: options.targetBalance || 0.1, // 目标均衡度
      weightDayBalance: options.weightDayBalance || 0.4, // 日均衡权重
      weightTeacherBalance: options.weightTeacherBalance || 0.3, // 教师均衡权重
      weightPeriodBalance: options.weightPeriodBalance || 0.3, // 时段均衡权重
      maxDailyLessons: options.maxDailyLessons || 8, // 每日最大课程数
      maxConsecutive: options.maxConsecutive || 2, // 最大连续课程数
    };

    // 初始化每天的课程分布
    this.dailySchedules = Array(5)
      .fill()
      .map(() => []);

    // 构建单双周课程映射
    this.alternateWeekPairs = new Map(); // Map<scheduleId, relatedScheduleId>
    this.buildAlternateWeekPairs();

    this.initializeDailySchedules();
  }

  /**
   * 构建单双周课程映射
   */
  buildAlternateWeekPairs() {
    // 按教师和课程分组
    const groupedSchedules = new Map(); // Map<teacherId_courseId_classId, Array<schedule>>

    this.schedules.forEach((schedule) => {
      if (!schedule.teacherId || !schedule.courseId || !schedule.classId)
        return;

      const key = `${schedule.teacherId}_${schedule.courseId}_${schedule.classId}`;
      if (!groupedSchedules.has(key)) {
        groupedSchedules.set(key, []);
      }
      groupedSchedules.get(key).push(schedule);
    });

    // 识别单双周配对
    groupedSchedules.forEach((schedules) => {
      if (schedules.length !== 2) return;

      const [s1, s2] = schedules;
      // 检查是否为单双周配对
      const isAlternatePair = this.isAlternateWeekPair(s1.weeks, s2.weeks);

      if (isAlternatePair) {
        this.alternateWeekPairs.set(s1._id.toString(), s2._id.toString());
        this.alternateWeekPairs.set(s2._id.toString(), s1._id.toString());
        console.log("发现单双周配对:", {
          schedule1: { id: s1._id, weeks: s1.weeks },
          schedule2: { id: s2._id, weeks: s2.weeks },
        });
      }
    });
  }

  /**
   * 检查两个周次数组是否构成单双周配对
   */
  isAlternateWeekPair(weeks1, weeks2) {
    if (!Array.isArray(weeks1) || !Array.isArray(weeks2)) return false;

    // 确保两个数组都已排序
    const sorted1 = [...weeks1].sort((a, b) => a - b);
    const sorted2 = [...weeks2].sort((a, b) => a - b);

    // 检查是否一个是单周一个是双周
    const isOdd1 = sorted1.every((w) => w % 2 === 1);
    const isEven1 = sorted1.every((w) => w % 2 === 0);
    const isOdd2 = sorted2.every((w) => w % 2 === 1);
    const isEven2 = sorted2.every((w) => w % 2 === 0);

    return (isOdd1 && isEven2) || (isEven1 && isOdd2);
  }

  /**
   * 初始化每天的课程分布
   */
  initializeDailySchedules() {
    this.schedules.forEach((schedule) => {
      const dayIndex = schedule.dayOfWeek - 1;
      if (dayIndex >= 0 && dayIndex < 5) {
        this.dailySchedules[dayIndex].push(schedule);
      }
    });
  }

  /**
   * 计算课表的均衡度评分
   * 评分越低越好
   * @returns {Object} 评分详情
   */
  calculateBalanceScore() {
    // 1. 计算日课程数均衡度
    const dailyCounts = this.dailySchedules.map((day) => day.length);
    const avgDailyCount = dailyCounts.reduce((a, b) => a + b, 0) / 5;
    const dayVariance =
      dailyCounts.reduce((sum, count) => {
        return sum + Math.pow(count - avgDailyCount, 2);
      }, 0) / 5;
    const dayBalanceScore = Math.sqrt(dayVariance);

    // 2. 计算教师工作量均衡度
    const teacherDailyLoads = new Map(); // Map<teacherId, Array<daily_count>>
    this.dailySchedules.forEach((daySchedules, dayIndex) => {
      daySchedules.forEach((schedule) => {
        // 确保 teacherId 存在且有效
        if (!schedule.teacherId) {
          console.warn("发现课程缺少教师ID:", schedule);
          return;
        }
        const teacherId = schedule.teacherId.toString();
        if (!teacherDailyLoads.has(teacherId)) {
          teacherDailyLoads.set(teacherId, Array(5).fill(0));
        }
        teacherDailyLoads.get(teacherId)[dayIndex]++;
      });
    });

    let teacherBalanceScore = 0;
    teacherDailyLoads.forEach((dailyLoads) => {
      const avgLoad = dailyLoads.reduce((a, b) => a + b, 0) / 5;
      const variance =
        dailyLoads.reduce((sum, load) => {
          return sum + Math.pow(load - avgLoad, 2);
        }, 0) / 5;
      teacherBalanceScore += Math.sqrt(variance);
    });
    teacherBalanceScore /= teacherDailyLoads.size || 1;

    // 3. 计算时段分布均衡度
    const periodBalanceScore = this.calculatePeriodBalanceScore();

    // 4. 计算加权总分
    const totalScore =
      this.options.weightDayBalance * dayBalanceScore +
      this.options.weightTeacherBalance * teacherBalanceScore +
      this.options.weightPeriodBalance * periodBalanceScore;

    return {
      total: totalScore,
      dayBalance: dayBalanceScore,
      teacherBalance: teacherBalanceScore,
      periodBalance: periodBalanceScore,
    };
  }

  /**
   * 计算时段分布均衡度
   * @returns {number} 评分
   */
  calculatePeriodBalanceScore() {
    const periodCounts = new Map(); // Map<periodId, Array<daily_count>>

    this.dailySchedules.forEach((daySchedules, dayIndex) => {
      daySchedules.forEach((schedule) => {
        const periodId = schedule.timeSlotId.toString();
        if (!periodCounts.has(periodId)) {
          periodCounts.set(periodId, Array(5).fill(0));
        }
        periodCounts.get(periodId)[dayIndex]++;
      });
    });

    let totalVariance = 0;
    periodCounts.forEach((dailyCounts) => {
      const avg = dailyCounts.reduce((a, b) => a + b, 0) / 5;
      const variance =
        dailyCounts.reduce((sum, count) => {
          return sum + Math.pow(count - avg, 2);
        }, 0) / 5;
      totalVariance += Math.sqrt(variance);
    });

    return totalVariance / (periodCounts.size || 1);
  }

  /**
   * 检查移动课程是否会造成冲突
   * @param {Object} schedule - 要移动的课程
   * @param {number} targetDay - 目标日期索引
   * @param {Object} timeSlot - 目标时间槽
   * @returns {boolean} 是否有冲突
   */
  checkConflicts(schedule, targetDay, timeSlot) {
    const targetDaySchedules = this.dailySchedules[targetDay];

    // 添加调试日志
    console.log("检查冲突:", {
      schedule: {
        id: schedule._id,
        teacherId: schedule.teacherId,
        classId: schedule.classId,
        timeSlotId: schedule.timeSlotId,
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
          s._id !== schedule._id; // 排除自身

        if (isConflict) {
          console.log("发现教师冲突:", {
            sourceTeacher: schedule.teacherId.toString(),
            targetTeacher: s.teacherId.toString(),
            sourceTimeSlot: schedule.timeSlotId,
            targetTimeSlot: s.timeSlotId,
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
          s._id !== schedule._id; // 排除自身

        if (isConflict) {
          console.log("发现班级冲突:", {
            sourceClass: schedule.classId.toString(),
            targetClass: s.classId.toString(),
            sourceTimeSlot: schedule.timeSlotId,
            targetTimeSlot: s.timeSlotId,
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
          s._id !== schedule._id; // 排除自身

        if (isConsecutive) {
          console.log("发现连续课程:", {
            sourceTimeSlot: schedule.timeSlotId,
            targetTimeSlot: s.timeSlotId,
            difference: Math.abs(
              parseInt(s.timeSlotId) - parseInt(schedule.timeSlotId)
            ),
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

  /**
   * 尝试移动课程到目标日期
   * @param {Object} schedule - 要移动的课程
   * @param {number} fromDay - 源日期索引
   * @param {number} toDay - 目标日期索引
   * @returns {boolean} 是否移动成功
   */
  tryMoveSchedule(schedule, fromDay, toDay) {
    // 检查课程和教师信息是否完整
    if (!schedule || !schedule.timeSlotId) {
      console.warn("课程信息不完整:", schedule);
      return false;
    }

    // 获取配对的单双周课程
    const pairedScheduleId = this.alternateWeekPairs.get(
      schedule._id.toString()
    );
    let pairedSchedule = null;
    if (pairedScheduleId) {
      pairedSchedule = this.dailySchedules[fromDay].find(
        (s) => s._id.toString() === pairedScheduleId
      );
      console.log("找到配对课程:", {
        mainSchedule: { id: schedule._id, weeks: schedule.weeks },
        pairedSchedule: pairedSchedule
          ? { id: pairedSchedule._id, weeks: pairedSchedule.weeks }
          : "未找到",
      });
    }

    // 检查移动主课程的冲突
    if (this.checkConflicts(schedule, toDay, schedule.timeSlotId)) {
      return false;
    }

    // 如果有配对课程，也需要检查其冲突
    if (pairedSchedule) {
      // 尝试将配对课程移动到相同时间槽
      if (
        this.checkConflicts(pairedSchedule, toDay, pairedSchedule.timeSlotId)
      ) {
        return false;
      }
    }

    // 计算移动前的评分
    const beforeScore = this.calculateBalanceScore().total;

    // 临时移动主课程
    const fromDaySchedules = this.dailySchedules[fromDay];
    const toDaySchedules = this.dailySchedules[toDay];
    const scheduleIndex = fromDaySchedules.findIndex((s) => s === schedule);

    fromDaySchedules.splice(scheduleIndex, 1);
    toDaySchedules.push(schedule);

    // 如果有配对课程，也移动它
    let pairedScheduleIndex = -1;
    if (pairedSchedule) {
      pairedScheduleIndex = fromDaySchedules.findIndex(
        (s) => s === pairedSchedule
      );
      if (pairedScheduleIndex !== -1) {
        fromDaySchedules.splice(pairedScheduleIndex, 1);
        toDaySchedules.push(pairedSchedule);
      }
    }

    // 计算移动后的评分
    const afterScore = this.calculateBalanceScore().total;

    // 如果评分没有改善，撤销移动
    if (afterScore >= beforeScore) {
      // 撤销主课程移动
      toDaySchedules.pop();
      fromDaySchedules.splice(scheduleIndex, 0, schedule);

      // 如果有配对课程，也撤销它的移动
      if (pairedSchedule && pairedScheduleIndex !== -1) {
        toDaySchedules.pop();
        fromDaySchedules.splice(pairedScheduleIndex, 0, pairedSchedule);
      }
      return false;
    }

    // 更新课程的 dayOfWeek
    schedule.dayOfWeek = toDay + 1;
    if (pairedSchedule) {
      pairedSchedule.dayOfWeek = toDay + 1;
    }

    return true;
  }

  /**
   * 执行优化
   * @returns {Object} 优化结果
   */
  optimize() {
    let iterations = 0;
    let improvements = 0;
    const initialScore = this.calculateBalanceScore();

    while (iterations < this.options.maxIterations) {
      // 找出课程最多和最少的日期
      const dayCounts = this.dailySchedules.map((schedules, index) => ({
        index,
        count: schedules.length,
      }));
      dayCounts.sort((a, b) => b.count - a.count);

      const maxDay = dayCounts[0].index;
      const minDay = dayCounts[4].index;

      // 尝试移动课程
      let improved = false;
      for (const schedule of this.dailySchedules[maxDay]) {
        if (this.tryMoveSchedule(schedule, maxDay, minDay)) {
          improved = true;
          improvements++;
          break;
        }
      }

      // 如果没有改善或达到目标均衡度，停止优化
      if (
        !improved ||
        this.calculateBalanceScore().total <= this.options.targetBalance
      ) {
        break;
      }

      iterations++;
    }

    const finalScore = this.calculateBalanceScore();

    return {
      success: true,
      iterations,
      improvements,
      initialScore,
      finalScore,
      schedules: this.schedules.map((s) => ({
        ...s,
        dayOfWeek: s.dayOfWeek,
      })),
    };
  }
}

module.exports = ScheduleOptimizer;
