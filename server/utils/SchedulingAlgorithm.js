class SchedulingAlgorithm {
  constructor(
    teachers,
    courses,
    classrooms,
    startWeek,
    endWeek,
    priority,
    considerClassroom = false
  ) {
    this.teachers = teachers;
    this.courses = courses;
    this.classrooms = classrooms;
    this.startWeek = startWeek;
    this.endWeek = endWeek;
    this.priority = priority;
    this.considerClassroom = considerClassroom;

    // 遗传算法参数
    this.populationSize = 100; // 种群大小
    this.generations = 100; // 迭代次数
    this.mutationRate = 0.1; // 变异率
    this.elitismCount = 10; // 精英个体数量
  }

  // 生成初始种群
  generateInitialPopulation() {
    const population = [];
    for (let i = 0; i < this.populationSize; i++) {
      const schedule = this.generateRandomSchedule();
      population.push(schedule);
    }
    return population;
  }

  // 生成随机课程表
  generateRandomSchedule() {
    const schedule = [];
    const teacherTimeSlots = new Map(); // 用于跟踪教师已用时间段

    // 为每个课程安排时间
    for (const course of this.courses) {
      // 获取课程的教师
      const teacher = course.teacher;
      if (!teacher) continue;

      // 初始化教师的时间槽记录
      if (!teacherTimeSlots.has(teacher._id.toString())) {
        teacherTimeSlots.set(teacher._id.toString(), new Set());
      }

      // 获取课程的实际周次范围
      const courseStartWeek = Math.max(
        this.startWeek,
        course.weeks?.start || this.startWeek
      );
      const courseEndWeek = Math.min(
        this.endWeek,
        course.weeks?.end || this.endWeek
      );

      // 如果课程的周次范围不在排课范围内，跳过
      if (courseStartWeek > courseEndWeek) {
        console.warn(
          `课程 ${course.name} 的周次范围 (${course.weeks?.start}-${course.weeks?.end}) 不在排课范围内 (${this.startWeek}-${this.endWeek})`
        );
        continue;
      }

      // 为这门课程在其周次范围内安排时间
      let timeSlot, dayOfWeek;
      let attempts = 0;
      const maxAttempts = 50;

      // 尝试找到可用的时间段
      do {
        dayOfWeek = Math.floor(Math.random() * 5) + 1; // 1-5 代表周一到周五
        timeSlot = this.getRandomTimeSlot();
        attempts++;

        // 检查教师在这些周次的时间段是否都可用
        const isTimeSlotAvailable = !Array.from(
          { length: courseEndWeek - courseStartWeek + 1 },
          (_, i) => courseStartWeek + i
        ).some((week) => {
          const timeKey = `${week}-${dayOfWeek}-${timeSlot}`;
          return teacherTimeSlots.get(teacher._id.toString()).has(timeKey);
        });

        if (isTimeSlotAvailable) {
          // 标记这些周次的时间段为已使用
          for (let week = courseStartWeek; week <= courseEndWeek; week++) {
            const timeKey = `${week}-${dayOfWeek}-${timeSlot}`;
            teacherTimeSlots.get(teacher._id.toString()).add(timeKey);
          }
          break;
        }
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        console.warn("无法为课程找到合适的时间段:", course.name);
        continue;
      }

      // 为每个周次创建课程安排
      for (let week = courseStartWeek; week <= courseEndWeek; week++) {
        schedule.push({
          week,
          day: this.getDayName(dayOfWeek),
          timeSlot,
          course: course._id,
          teacher: teacher._id,
          ...(this.considerClassroom && {
            classroom: this.getRandomClassroom(course.studentCount)?._id,
          }),
        });
      }
    }

    return schedule;
  }

  // 适应度评估
  evaluateFitness(schedule) {
    let fitness = 100; // 起始适应度

    // 检查教师时间冲突
    const teacherConflicts = this.checkTeacherConflicts(schedule);
    fitness -= teacherConflicts * 10;

    // 只在需要时检查教室冲突
    if (this.considerClassroom) {
      const classroomConflicts = this.checkClassroomConflicts(schedule);
      fitness -= classroomConflicts * 10;
    }

    // 检查教师工作量
    const workloadViolations = this.checkTeacherWorkload(schedule);
    fitness -= workloadViolations * 5;

    return Math.max(0, fitness);
  }

  // 检查教师时间冲突
  checkTeacherConflicts(schedule) {
    let conflicts = 0;
    const teacherBookings = new Map();

    for (const item of schedule) {
      const key = `${item.teacher}-${item.week}-${item.day}-${item.timeSlot}`;
      if (teacherBookings.has(key)) {
        conflicts++;
      }
      teacherBookings.set(key, true);
    }

    return conflicts;
  }

  // 检查教室时间冲突
  checkClassroomConflicts(schedule) {
    if (!this.considerClassroom) return 0;

    let conflicts = 0;
    const classroomBookings = new Map();

    for (const item of schedule) {
      if (!item.classroom) continue;
      const key = `${item.classroom}-${item.week}-${item.day}-${item.timeSlot}`;
      if (classroomBookings.has(key)) {
        conflicts++;
      }
      classroomBookings.set(key, true);
    }

    return conflicts;
  }

  // 检查教师工作量
  checkTeacherWorkload(schedule) {
    const teacherHours = new Map();
    let violations = 0;

    // 统计每个教师的工作量
    for (const item of schedule) {
      const hours = teacherHours.get(item.teacher.toString()) || 0;
      const course = this.courses.find((c) => c._id.equals(item.course));
      teacherHours.set(
        item.teacher.toString(),
        hours + (course ? course.hours : 0)
      );
    }

    // 检查是否违反工作量限制
    for (const teacher of this.teachers) {
      const hours = teacherHours.get(teacher._id.toString()) || 0;
      if (
        hours < teacher.teachingHours?.min ||
        hours > teacher.teachingHours?.max
      ) {
        violations++;
      }
    }

    return violations;
  }

  // 获取随机时间段
  getRandomTimeSlot() {
    const slots = ["1-2", "3-4", "5-6", "7-8", "9-10"];
    return slots[Math.floor(Math.random() * slots.length)];
  }

  // 获取星期名称
  getDayName(day) {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    return days[day - 1];
  }

  // 获取随机教室
  getRandomClassroom(studentCount) {
    if (!this.considerClassroom || !this.classrooms.length) return null;

    const suitableClassrooms = this.classrooms.filter(
      (c) => c.capacity >= (studentCount || 0)
    );

    if (!suitableClassrooms.length) return null;

    return suitableClassrooms[
      Math.floor(Math.random() * suitableClassrooms.length)
    ];
  }

  // 运行遗传算法
  async run() {
    let population = this.generateInitialPopulation();
    let bestSchedule = null;
    let bestFitness = -1;

    for (let generation = 0; generation < this.generations; generation++) {
      // 评估适应度
      const fitnessScores = population.map((schedule) => ({
        schedule,
        fitness: this.evaluateFitness(schedule),
      }));

      // 找到最佳解
      const currentBest = fitnessScores.reduce((best, current) =>
        current.fitness > best.fitness ? current : best
      );

      if (currentBest.fitness > bestFitness) {
        bestFitness = currentBest.fitness;
        bestSchedule = currentBest.schedule;
      }

      // 如果找到完美解或达到最大代数，则停止
      if (bestFitness >= 100 || generation === this.generations - 1) {
        break;
      }

      // 生成下一代
      population = this.selection(fitnessScores);
    }

    return bestSchedule;
  }
}

module.exports = SchedulingAlgorithm;
