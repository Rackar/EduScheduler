class SchedulingAlgorithm {
  constructor(courses = [], options = {}) {
    if (!Array.isArray(courses)) {
      console.warn("课程参数不是数组，将使用空数组");
      this.courses = [];
    } else {
      this.courses = courses;
    }

    this.schedules = [];
    this.startWeek = options.startWeek || 1;
    this.endWeek = options.endWeek || 20;
    this.courseTimeSlots = new Map(); // 记录每门课的固定时间段
    this.usedSlots = new Map(); // 记录已使用的时间段

    // 按周学时数从大到小排序课程
    this.courses.sort((a, b) => (b.hours || 0) - (a.hours || 0));

    console.log(`初始化排课算法，课程数量: ${this.courses.length}`);
    console.log(`排课周次范围: 第${this.startWeek}周 到 第${this.endWeek}周`);
  }

  // 评分函数：评估时间段的适合程度
  evaluateTimeSlot(course, week, day, timeSlot, existingSlots) {
    let score = 100;

    // 1. 检查是否与已有的固定时间段相邻
    const hasAdjacentSlot = existingSlots.some(
      (slot) =>
        slot.dayOfWeek === day && Math.abs(slot.timeSlot - timeSlot) === 1
    );
    if (hasAdjacentSlot) score += 20;

    // 2. 优先选择上午的时间段
    if (timeSlot <= 4) score += 10;

    // 3. 避免课程安排在一天的最后时段
    if (timeSlot === 5) score -= 10;

    // 4. 尽量避免同一天安排过多课程
    const sameDaySlots = existingSlots.filter((slot) => slot.dayOfWeek === day);
    if (sameDaySlots.length >= 2) score -= 15;

    // 5. 优先选择周一到周四的时间段
    if (day === 5) score -= 5;

    return score;
  }

  // 寻找最佳时间段
  async findBestTimeSlot(course, week, existingSlots) {
    let bestSlot = null;
    let bestScore = -1;

    // 优先尝试固定时间段
    for (const slot of existingSlots) {
      const schedule = {
        course: course._id,
        teacher: course.teacher,
        classes: course.classes,
        week,
        dayOfWeek: slot.dayOfWeek,
        timeSlot: slot.timeSlot,
      };

      if (await this.checkSlotAvailability(schedule)) {
        const score = this.evaluateTimeSlot(
          course,
          week,
          slot.dayOfWeek,
          slot.timeSlot,
          existingSlots
        );
        if (score > bestScore) {
          bestScore = score;
          bestSlot = slot;
        }
      }
    }

    if (bestSlot) return bestSlot;

    // 寻找新的时间段
    for (let day = 1; day <= 5; day++) {
      for (let slot = 1; slot <= 5; slot++) {
        // 检查是否与已选时间段冲突
        if (
          existingSlots.some((s) => s.dayOfWeek === day && s.timeSlot === slot)
        ) {
          continue;
        }

        const schedule = {
          course: course._id,
          teacher: course.teacher,
          classes: course.classes,
          week,
          dayOfWeek: day,
          timeSlot: slot,
        };

        if (await this.checkSlotAvailability(schedule)) {
          const score = this.evaluateTimeSlot(
            course,
            week,
            day,
            slot,
            existingSlots
          );
          if (score > bestScore) {
            bestScore = score;
            bestSlot = { dayOfWeek: day, timeSlot: slot };
          }
        }
      }
    }

    return bestSlot;
  }

  async generate() {
    try {
      if (!Array.isArray(this.courses) || this.courses.length === 0) {
        console.warn("没有需要排课的课程");
        return [];
      }

      // 获取本周需要排课的课程
      for (let week = this.startWeek; week <= this.endWeek; week++) {
        console.log(`开始处理第 ${week} 周的课程安排`);

        const coursesThisWeek = this.courses.filter(
          (course) =>
            course.weeks &&
            course.weeks.start <= week &&
            course.weeks.end >= week
        );

        console.log(
          `第 ${week} 周需要排课的课程数量: ${coursesThisWeek.length}`
        );

        for (const course of coursesThisWeek) {
          const courseKey = course._id.toString();
          const weeklyHours = course.hours || 0;

          if (weeklyHours === 0) {
            console.warn(
              `课程 ${course.name} (${courseKey}) 的周学时为0，跳过`
            );
            continue;
          }

          console.log(`处理课程: ${course.name}, 周学时: ${weeklyHours}`);

          // 检查这门课是否已有固定时间段
          let fixedSlots = this.courseTimeSlots.get(courseKey);

          if (!fixedSlots) {
            // 如果没有固定时间段，寻找新的可用时间段
            fixedSlots = [];
            for (let i = 0; i < weeklyHours; i++) {
              const slot = await this.findBestTimeSlot(
                course,
                week,
                fixedSlots
              );
              if (slot) {
                fixedSlots.push(slot);
              } else {
                console.warn(`无法为课程 ${course.name} 找到足够的时间段`);
                break;
              }
            }
            // 记录这门课的固定时间段
            if (fixedSlots.length === weeklyHours) {
              this.courseTimeSlots.set(courseKey, fixedSlots);
              console.log(
                `为课程 ${course.name} 设置了固定时间段:`,
                fixedSlots
              );
            }
          }

          // 使用固定时间段创建课程安排
          for (const slot of fixedSlots) {
            const schedule = {
              course: course._id,
              teacher: course.teacher,
              classes: course.classes,
              week,
              dayOfWeek: slot.dayOfWeek,
              timeSlot: slot.timeSlot,
              status: "draft",
            };

            // 检查时间段是否已被占用
            const isSlotAvailable = await this.checkSlotAvailability(schedule);
            if (isSlotAvailable) {
              this.schedules.push(schedule);
              this.markSlotAsUsed(schedule);
              console.log(
                `成功安排课程 ${course.name} 在第 ${week} 周星期${slot.dayOfWeek} 第${slot.timeSlot}节`
              );
            } else {
              // 如果固定时间段被占用，尝试找新的时间段
              const newSlot = await this.findBestTimeSlot(course, week, []);
              if (newSlot) {
                schedule.dayOfWeek = newSlot.dayOfWeek;
                schedule.timeSlot = newSlot.timeSlot;
                this.schedules.push(schedule);
                this.markSlotAsUsed(schedule);
                console.log(
                  `为课程 ${course.name} 找到替代时间段: 星期${newSlot.dayOfWeek} 第${newSlot.timeSlot}节`
                );
              } else {
                console.warn(
                  `无法为课程 ${course.name} 在第 ${week} 周找到替代时间段`
                );
              }
            }
          }
        }
      }

      console.log(`课表生成完成，总计生成 ${this.schedules.length} 条排课记录`);
      return this.schedules;
    } catch (error) {
      console.error("生成课表失败:", error);
      throw error;
    }
  }

  // 检查时间段是否可用
  async checkSlotAvailability(schedule) {
    const { week, dayOfWeek, timeSlot, teacher, classes } = schedule;
    const key = `${week}-${dayOfWeek}-${timeSlot}`;

    // 检查该时间段是否已被使用
    const usedSlot = this.usedSlots.get(key);
    if (usedSlot) {
      // 检查教师冲突
      if (
        usedSlot.some(
          (s) => s.teacher && s.teacher.toString() === teacher?.toString()
        )
      ) {
        return false;
      }
      // 检查班级冲突
      if (
        usedSlot.some((s) =>
          s.classes?.some((c1) =>
            classes?.some((c2) => c1.toString() === c2.toString())
          )
        )
      ) {
        return false;
      }
    }

    return true;
  }

  // 标记时间段为已使用
  markSlotAsUsed(schedule) {
    const { week, dayOfWeek, timeSlot } = schedule;
    const key = `${week}-${dayOfWeek}-${timeSlot}`;

    const usedSlot = this.usedSlots.get(key) || [];
    usedSlot.push(schedule);
    this.usedSlots.set(key, usedSlot);
  }
}

module.exports = SchedulingAlgorithm;
