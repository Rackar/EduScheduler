class SchedulingAlgorithm {
  constructor(options) {
    this.templateId = options.templateId;
    this.startWeek = options.startWeek;
    this.endWeek = options.endWeek;
    this.minDailyLessons = options.minDailyLessons || 2;
    this.maxDailyLessons = options.maxDailyLessons || 3;
    this.distribution = options.distribution || "balanced";
    this.allowAlternateWeeks = options.allowAlternateWeeks || true;
    this.availableSlots = options.availableSlots || [];
    this.priority = options.priority || "teacher";
    this.considerClassroom = options.considerClassroom || true;
    this.avoidTimeSlots = options.avoidTimeSlots || [];

    // 存储已分配的时间段
    this.teacherSchedule = new Map(); // 教师已排课时间
    this.classSchedule = new Map(); // 班级已排课时间
    this.roomSchedule = new Map(); // 教室已排课时间

    // 存储课程的排课计数
    this.courseScheduleCount = new Map(); // 课程已排课次数
  }

  // 生成课程表
  async generate(courses, teachers, classrooms, template) {
    console.log("开始生成课表...");
    console.log("课程数量:", courses.length);
    console.log("教师数量:", teachers.length);
    console.log("教室数量:", classrooms.length);

    const schedule = [];
    const weekRange = Array.from(
      { length: this.endWeek - this.startWeek + 1 },
      (_, i) => this.startWeek + i
    );
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];

    // 按课时数排序课程
    const sortedCourses = [...courses].sort(
      (a, b) => (b.hours || 0) - (a.hours || 0)
    );

    for (const course of sortedCourses) {
      console.log("处理课程:", course.name);
      const totalWeeklySlots = this.calculateWeeklySlots(course.hours || 0);
      const totalNeededSlots =
        totalWeeklySlots * (this.endWeek - this.startWeek + 1);

      // 检查是否已经为这门课程排够了课
      const currentScheduledCount =
        this.courseScheduleCount.get(course.id) || 0;
      if (currentScheduledCount >= totalNeededSlots) {
        console.log(`课程 ${course.name} 已排满所需课时`);
        continue;
      }

      const teacher = teachers.find((t) => t.id === course.teacherId);
      const classroom = this.considerClassroom
        ? classrooms.find((r) => r.id === course.classroomId)
        : null;

      if (!teacher) {
        console.warn(`未找到课程 ${course.name} 的教师`);
        continue;
      }

      // 为每周分配时间段
      for (const week of weekRange) {
        // 如果是单双周课程，检查是否需要在本周排课
        if (this.allowAlternateWeeks && course.hours === 3) {
          if (!this.shouldScheduleInWeek(week, course)) {
            continue;
          }
        }

        const slotsNeeded = this.getSlotsNeededForWeek(
          week,
          course,
          totalWeeklySlots
        );
        if (slotsNeeded === 0) continue;

        console.log(
          `查找第 ${week} 周的可用时间段，需要 ${slotsNeeded} 个时段`
        );

        // 查找可用时间段
        const availableSlots = this.findAvailableSlots(
          week,
          days,
          teacher,
          course.classId,
          classroom,
          slotsNeeded
        );

        if (availableSlots.length < slotsNeeded) {
          console.warn(`无法为课程 ${course.name} 找到足够的时间段`);
          continue;
        }

        // 分配时间段
        for (let i = 0; i < slotsNeeded; i++) {
          // 检查是否已经达到总课时数
          const updatedCount =
            (this.courseScheduleCount.get(course.id) || 0) + 1;
          if (updatedCount > totalNeededSlots) {
            console.log(`课程 ${course.name} 已达到总课时数限制`);
            break;
          }

          const slot = availableSlots[i];
          schedule.push({
            courseId: course.id,
            teacherId: teacher.id,
            classId: course.classId,
            classroomId: classroom?.id,
            week,
            day: slot.day,
            timeSlot: slot.timeSlot,
          });

          // 更新课程计数
          this.courseScheduleCount.set(course.id, updatedCount);

          // 更新已分配时间记录
          this.markTimeSlotAsUsed(week, slot.day, slot.timeSlot, {
            teacherId: teacher.id,
            classId: course.classId,
            classroomId: classroom?.id,
          });
        }
      }
    }

    console.log("课表生成完成，总计:", schedule.length);
    return schedule;
  }

  // 计算每周需要的时间段数
  calculateWeeklySlots(weeklyHours) {
    // 职高模板下，一节课是两个学时
    return Math.ceil(weeklyHours / 2);
  }

  // 判断是否需要在指定周次排课（用于处理单双周）
  shouldScheduleInWeek(week, course) {
    if (course.hours !== 3) return true;

    // 对于3学时的课程，实现单双周排课
    const isOddWeek = week % 2 === 1;
    // 随机决定是单周排2节还是双周排2节
    const moreInOddWeek = Math.random() < 0.5;

    if (moreInOddWeek) {
      return isOddWeek ? 2 : 1;
    } else {
      return isOddWeek ? 1 : 2;
    }
  }

  // 获取指定周次需要的时间段数
  getSlotsNeededForWeek(week, course, weeklySlots) {
    if (course.hours === 3) {
      const slots = this.shouldScheduleInWeek(week, course);
      return typeof slots === "number" ? slots : 0;
    }
    return weeklySlots;
  }

  // 查找可用时间段
  findAvailableSlots(week, days, teacher, classId, classroom, slotsNeeded) {
    if (!teacher || !teacher.id) {
      console.warn("教师对象无效:", teacher);
      return [];
    }

    if (!classId) {
      console.warn("班级ID无效");
      return [];
    }

    const availableSlots = [];

    // 根据分布策略排序时间段
    const sortedDays =
      this.distribution === "concentrated"
        ? days
        : this.shuffleArray([...days]);

    for (const day of sortedDays) {
      // 检查当天已安排的课程数
      const dailyLessons = this.countDailyLessons(week, day, classId);
      if (dailyLessons >= this.maxDailyLessons) continue;

      for (const timeSlot of this.availableSlots) {
        // 跳过需要避免的时间段
        if (this.avoidTimeSlots.includes(timeSlot)) continue;

        // 检查时间段是否可用
        if (
          this.isTimeSlotAvailable(
            week,
            day,
            timeSlot,
            teacher,
            classId,
            classroom
          )
        ) {
          availableSlots.push({ day, timeSlot });
          if (availableSlots.length === slotsNeeded) {
            return availableSlots;
          }
        }
      }
    }

    return availableSlots;
  }

  // 检查时间段是否可用
  isTimeSlotAvailable(week, day, timeSlot, teacher, classId, classroom) {
    if (!teacher || !teacher.id) {
      console.warn("教师对象无效:", teacher);
      return false;
    }

    if (!classId) {
      console.warn("班级ID无效");
      return false;
    }

    const timeKey = `${week}-${day}-${timeSlot}`;

    // 检查教师是否可用
    if (
      this.teacherSchedule.has(teacher.id) &&
      this.teacherSchedule.get(teacher.id).has(timeKey)
    ) {
      return false;
    }

    // 检查班级是否可用
    if (
      this.classSchedule.has(classId) &&
      this.classSchedule.get(classId).has(timeKey)
    ) {
      return false;
    }

    // 检查教室是否可用
    if (
      classroom &&
      classroom.id &&
      this.roomSchedule.has(classroom.id) &&
      this.roomSchedule.get(classroom.id).has(timeKey)
    ) {
      return false;
    }

    return true;
  }

  // 标记时间段为已使用
  markTimeSlotAsUsed(week, day, timeSlot, { teacherId, classId, classroomId }) {
    const timeKey = `${week}-${day}-${timeSlot}`;

    // 更新教师时间表
    if (!this.teacherSchedule.has(teacherId)) {
      this.teacherSchedule.set(teacherId, new Set());
    }
    this.teacherSchedule.get(teacherId).add(timeKey);

    // 更新班级时间表
    if (!this.classSchedule.has(classId)) {
      this.classSchedule.set(classId, new Set());
    }
    this.classSchedule.get(classId).add(timeKey);

    // 更新教室时间表
    if (classroomId) {
      if (!this.roomSchedule.has(classroomId)) {
        this.roomSchedule.set(classroomId, new Set());
      }
      this.roomSchedule.get(classroomId).add(timeKey);
    }
  }

  // 计算某天已安排的课程数
  countDailyLessons(week, day, classId) {
    if (!this.classSchedule.has(classId)) return 0;

    const schedule = this.classSchedule.get(classId);
    return Array.from(schedule).filter((timeKey) =>
      timeKey.startsWith(`${week}-${day}-`)
    ).length;
  }

  // 工具方法：随机打乱数组
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

module.exports = SchedulingAlgorithm;
