class SchedulingAlgorithm {
  constructor(courses = [], options = {}) {
    if (!Array.isArray(courses)) {
      console.warn("课程参数不是数组，将使用空数组");
      this.courses = [];
    } else {
      this.courses = courses;
    }

    if (options.template) {
      this.template = options.template;
    }

    this.schedules = [];
    this.startWeek = options.startWeek || 1;
    this.endWeek = options.endWeek || 20;
    this.availableSlots = options.availableSlots;
    this.courseTimeSlots = new Map(); // 记录每门课的固定时间段
    this.usedSlots = new Map(); // 记录已使用的时间段

    // 从模板中获取时间段
    // this.timeSlots = this.template.periods.map((slot) => ({
    //   id: slot._id,
    //   start: slot.startTime,
    //   end: slot.endTime,
    //   name: slot.name,
    //   type: slot.type, // 上午/下午/晚上
    //   duration: this.calculateDuration(slot.startTime, slot.endTime),
    // }));
    const flattenAndFilterPeriods = (template, availableSlots) => {
      // 扁平化所有时间段并添加类型字段
      const flatPeriods = Object.entries(template.periods).flatMap(
        ([type, slots]) =>
          slots.map((slot) => ({
            id: slot._id.toString(),
            name: slot.name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            creditHours: slot.creditHours,
            linkedSlots: slot.linkedSlots,
            type, // 添加类型字段
          }))
      );

      // 根据availableSlots进行过滤
      return flatPeriods.filter((slot) => availableSlots.includes(slot.id));
    };
    this.timeSlots = flattenAndFilterPeriods(
      this.template,
      this.availableSlots
    );

    // 按照上课周次长度和周学时数排序课程
    this.courses.sort((a, b) => {
      // 首先按照周次长度排序
      const aWeeks = (a.weeks?.end || 20) - (a.weeks?.start || 1);
      const bWeeks = (b.weeks?.end || 20) - (b.weeks?.start || 1);
      if (bWeeks !== aWeeks) {
        return bWeeks - aWeeks;
      }
      // 其次按照周学时数排序
      return (b.hours || 0) - (a.hours || 0);
    });

    console.log(`初始化排课算法，课程数量: ${this.courses.length}`);
    console.log(`排课周次范围: 第${this.startWeek}周 到 第${this.endWeek}周`);
    console.log("可用时间段:", this.timeSlots);
  }

  // 计算时间段时长（分钟）
  calculateDuration(startTime, endTime) {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    return endHour * 60 + endMinute - (startHour * 60 + startMinute);
  }

  // 验证课程数据完整性
  validateCourse(course) {
    if (!course._id) {
      throw new Error(`课程缺少ID: ${JSON.stringify(course)}`);
    }
    if (!course.teacher) {
      throw new Error(`课程 ${course._id} 缺少教师信息`);
    }
    if (!Array.isArray(course.classes) || course.classes.length === 0) {
      throw new Error(`课程 ${course._id} 缺少班级信息`);
    }
    return true;
  }

  // 获取适合的时间段
  findSuitableTimeSlots(duration) {
    // 根据课程时长找到合适的时间段组合
    // return this.timeSlots.filter(
    //   (slot) => Math.abs(slot.creditHours - duration) <= 0.2 // 允许12分钟的误差
    // );
    return this.timeSlots;
  }

  // 评分函数：评估时间段的适合程度
  evaluateTimeSlot(course, week, day, timeSlot, existingSlots) {
    let score = 100;

    // 1. 检查是否与已有的固定时间段相邻（保持课程连续性）
    const hasAdjacentSlot = existingSlots.some(
      (slot) =>
        slot.dayOfWeek === day &&
        Math.abs(
          this.timeSlots.findIndex((t) => t.id === slot.timeSlotId) -
            this.timeSlots.findIndex((t) => t.id === timeSlot.id)
        ) === 1
    );
    if (hasAdjacentSlot) score += 30;

    // 2. 根据时间段类型评分
    switch (timeSlot.type) {
      case "morning":
        score += 20; // 优先上午
        break;
      case "afternoon":
        score += 10; // 其次下午
        break;
      case "evening":
        score -= 10; // 避免晚上
        break;
    }

    // 3. 尽量避免同一天安排过多课程
    const sameDaySlots = existingSlots.filter((slot) => slot.dayOfWeek === day);
    if (sameDaySlots.length >= 2) score -= 25;

    // 4. 优先选择周一到周四的时间段
    if (day === 5) score -= 15;

    return score;
  }

  // 检查教师在指定时间段是否有其他课程
  async checkTeacherAvailability(teacher, week, day, timeSlotId) {
    if (!teacher) return true;

    const key = `${week}-${day}-${timeSlotId}`;
    const usedSlot = this.usedSlots.get(key);
    if (!usedSlot) return true;

    return !usedSlot.some(
      (s) => s.teacherId && s.teacherId.toString() === teacher.toString()
    );
  }

  // 创建课表记录
  createScheduleRecord(course, week, day, timeSlot) {
    // 验证课程数据
    this.validateCourse(course);

    return {
      templateId: this.template._id,
      courseId: course._id,
      teacherId: course.teacher,
      classId: course.classes[0], // 如果有多个班级，这里需要处理
      week,
      day,
      timeSlotId: timeSlot.id,
      status: "draft",
    };
  }

  // 寻找最佳时间段
  async findBestTimeSlot(course, week, existingSlots) {
    let bestSlot = null;
    let bestScore = -1;

    // 获取适合的时间段
    const suitableTimeSlots = this.findSuitableTimeSlots(course.hours || 1); // 默认1小时
    debugger;
    // 优先尝试固定时间段
    for (const slot of existingSlots) {
      const timeSlot = this.timeSlots.find((t) => t.id === slot.timeSlotId);
      if (!timeSlot) continue;

      const schedule = this.createScheduleRecord(
        course,
        week,
        slot.dayOfWeek,
        timeSlot
      );

      // 检查教师可用性
      const isTeacherAvailable = await this.checkTeacherAvailability(
        course.teacher,
        week,
        slot.dayOfWeek,
        timeSlot.id
      );

      if (isTeacherAvailable && (await this.checkSlotAvailability(schedule))) {
        const score = this.evaluateTimeSlot(
          course,
          week,
          slot.dayOfWeek,
          timeSlot,
          existingSlots
        );
        if (score > bestScore) {
          bestScore = score;
          bestSlot = { dayOfWeek: slot.dayOfWeek, timeSlotId: timeSlot.id };
        }
      }
    }

    if (bestSlot) return bestSlot;

    // 寻找新的时间段
    for (let day = 1; day <= 5; day++) {
      for (const timeSlot of suitableTimeSlots) {
        const schedule = this.createScheduleRecord(course, week, day, timeSlot);

        // 检查教师可用性
        const isTeacherAvailable = await this.checkTeacherAvailability(
          course.teacher,
          week,
          day,
          timeSlot.id
        );

        if (!isTeacherAvailable) continue;

        if (await this.checkSlotAvailability(schedule)) {
          const score = this.evaluateTimeSlot(
            course,
            week,
            day,
            timeSlot,
            existingSlots
          );
          if (score > bestScore) {
            bestScore = score;
            bestSlot = { dayOfWeek: day, timeSlotId: timeSlot.id };
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
          try {
            // 验证课程数据
            this.validateCourse(course);

            const courseKey = course._id.toString();
            const weeklyHours = course.hours || 0;

            if (weeklyHours === 0) {
              console.warn(
                `课程 ${course.name} (${courseKey}) 的周学时为0，跳过`
              );
              continue;
            }

            console.log(
              `处理课程: ${course.name}, 周学时: ${weeklyHours}, 周次: ${course.weeks.start}-${course.weeks.end}`
            );

            // 检查这门课是否已有固定时间段
            let fixedSlots = this.courseTimeSlots.get(courseKey);

            if (!fixedSlots) {
              // 如果没有固定时间段，寻找新的可用时间段
              fixedSlots = [];
              for (let i = 0; i < weeklyHours; i += 1) {
                // 每次增加2，因为是连续的两节课
                debugger;
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
              if (fixedSlots.length * 2 >= weeklyHours) {
                this.courseTimeSlots.set(courseKey, fixedSlots);
                console.log(
                  `为课程 ${course.name} 设置了固定时间段:`,
                  fixedSlots
                );
              }
            }

            // 使用固定时间段创建课程安排
            for (const slot of fixedSlots) {
              const timeSlot = parseInt(slot.timeSlot.split("-")[0]);
              const schedule = this.createScheduleRecord(
                course,
                week,
                slot.dayOfWeek,
                timeSlot
              );

              // 检查时间段是否已被占用
              const isSlotAvailable = await this.checkSlotAvailability(
                schedule
              );
              const isTeacherAvailable = await this.checkTeacherAvailability(
                course.teacher,
                week,
                slot.dayOfWeek,
                timeSlot
              );

              if (isSlotAvailable && isTeacherAvailable) {
                this.schedules.push(schedule);
                this.markSlotAsUsed(schedule);
                console.log(
                  `成功安排课程 ${course.name} 在第 ${week} 周星期${slot.dayOfWeek} 第${schedule.timeSlot}节`
                );
              } else {
                // 如果固定时间段被占用，尝试找新的时间段
                const newSlot = await this.findBestTimeSlot(course, week, []);
                if (newSlot) {
                  schedule.day = newSlot.dayOfWeek;
                  schedule.timeSlot = newSlot.timeSlot;
                  this.schedules.push(schedule);
                  this.markSlotAsUsed(schedule);
                  console.log(
                    `为课程 ${course.name} 找到替代时间段: 星期${newSlot.dayOfWeek} 第${schedule.timeSlot}节`
                  );
                } else {
                  console.warn(
                    `无法为课程 ${course.name} 在第 ${week} 周找到替代时间段`
                  );
                }
              }
            }
          } catch (error) {
            console.error(`处理课程 ${course.name} 时出错:`, error);
            continue;
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
    const { week, day, timeSlot, teacherId, classId } = schedule;
    const key = `${week}-${day}-${timeSlot}`;

    // 检查该时间段是否已被使用
    const usedSlot = this.usedSlots.get(key);
    if (usedSlot) {
      // 检查班级冲突
      if (usedSlot.some((s) => s.classId?.toString() === classId?.toString())) {
        return false;
      }
    }

    return true;
  }

  // 标记时间段为已使用
  markSlotAsUsed(schedule) {
    const { week, day, timeSlot } = schedule;
    const key = `${week}-${day}-${timeSlot}`;

    const usedSlot = this.usedSlots.get(key) || [];
    usedSlot.push(schedule);
    this.usedSlots.set(key, usedSlot);
  }
}

module.exports = SchedulingAlgorithm;
