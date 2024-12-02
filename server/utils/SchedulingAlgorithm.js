class SchedulingAlgorithm {
  constructor(teachers, courses, classrooms, classes, timeSlots) {
    this.teachers = teachers;
    this.courses = courses;
    this.classrooms = classrooms;
    this.classes = classes;
    this.timeSlots = timeSlots;

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

    // 为每个班级安排课程
    for (const classObj of this.classes) {
      const classSchedule = {
        classId: classObj._id,
        arrangements: [],
      };

      // 获取该班级需要上的课程
      const requiredCourses = this.courses.slice(0, 5); // 假设每个班级需要5门课

      const usedTimeSlots = new Map(); // 用于跟踪已使用的时间段

      for (const course of requiredCourses) {
        // 随机选择教室和时间段
        const classroom = this.getRandomClassroom(classObj.studentCount);
        let timeSlot;
        let dayOfWeek;
        do {
          timeSlot = this.getRandomTimeSlot();
          dayOfWeek = Math.floor(Math.random() * 5) + 1;
        } while (usedTimeSlots.has(`${dayOfWeek}-${timeSlot}`)); // 确保不重复使用时间段

        usedTimeSlots.set(`${dayOfWeek}-${timeSlot}`, true);

        classSchedule.arrangements.push({
          courseId: course._id,
          teacherId: course.teacher,
          classroomId: classroom._id,
          dayOfWeek,
          timeSlot,
        });
      }

      schedule.push(classSchedule);
    }

    return schedule;
  }

  // 适应度评估
  evaluateFitness(schedule) {
    let fitness = 100; // 起始适应度
    const conflicts = this.checkConflicts(schedule);
    const workloadViolations = this.checkTeacherWorkload(schedule);

    // 每个冲突扣分
    fitness -= conflicts * 10;
    // 每个工作量违规扣分
    fitness -= workloadViolations * 5;

    return Math.max(0, fitness);
  }

  // 检查时间冲突
  checkConflicts(schedule) {
    let conflicts = 0;

    // 检查教室冲突
    const classroomBookings = new Map();

    for (const classSchedule of schedule) {
      for (const arr of classSchedule.arrangements) {
        const key = `${arr.classroomId}-${arr.dayOfWeek}-${arr.timeSlot}`;
        if (classroomBookings.has(key)) {
          conflicts++;
        }
        classroomBookings.set(key, true);
      }
    }

    // 检查教师冲突
    const teacherBookings = new Map();

    for (const classSchedule of schedule) {
      for (const arr of classSchedule.arrangements) {
        const key = `${arr.teacherId}-${arr.dayOfWeek}-${arr.timeSlot}`;
        if (teacherBookings.has(key)) {
          conflicts++;
        }
        teacherBookings.set(key, true);
      }
    }

    return conflicts;
  }

  // 检查教师工作量
  checkTeacherWorkload(schedule) {
    const teacherHours = new Map();
    let violations = 0;

    // 统计每个教师的工作量
    for (const classSchedule of schedule) {
      for (const arr of classSchedule.arrangements) {
        const hours = teacherHours.get(arr.teacherId) || 0;
        const course = this.courses.find((c) => c._id.equals(arr.courseId));
        teacherHours.set(arr.teacherId, hours + (course ? course.hours : 0));
      }
    }

    // 检查是否违反工作量限制
    for (const teacher of this.teachers) {
      const hours = teacherHours.get(teacher._id) || 0;
      if (
        hours < teacher.teachingHours.min ||
        hours > teacher.teachingHours.max
      ) {
        violations++;
      }
    }

    return violations;
  }

  // 选择父代
  selection(population) {
    // 计算适应度
    const fitnessScores = population.map((schedule) => ({
      schedule,
      fitness: this.evaluateFitness(schedule),
    }));

    // 按适应度排序
    fitnessScores.sort((a, b) => b.fitness - a.fitness);

    // 保留精英个体
    const newPopulation = fitnessScores
      .slice(0, this.elitismCount)
      .map((item) => item.schedule);

    // 轮盘赌选择剩余个体
    while (newPopulation.length < this.populationSize) {
      const parent1 = this.rouletteWheelSelection(fitnessScores);
      const parent2 = this.rouletteWheelSelection(fitnessScores);
      const child = this.crossover(parent1, parent2);
      if (Math.random() < this.mutationRate) {
        this.mutate(child);
      }
      newPopulation.push(child);
    }

    return newPopulation;
  }

  // 轮盘赌选择
  rouletteWheelSelection(fitnessScores) {
    const totalFitness = fitnessScores.reduce(
      (sum, item) => sum + item.fitness,
      0
    );
    let random = Math.random() * totalFitness;

    for (const item of fitnessScores) {
      random -= item.fitness;
      if (random <= 0) {
        return item.schedule;
      }
    }

    return fitnessScores[0].schedule;
  }

  // 交叉操作
  crossover(parent1, parent2) {
    const child = [];

    for (let i = 0; i < parent1.length; i++) {
      if (Math.random() < 0.5) {
        child.push({ ...parent1[i] });
      } else {
        child.push({ ...parent2[i] });
      }
    }

    return child;
  }

  // 变异操作
  mutate(schedule) {
    const classIndex = Math.floor(Math.random() * schedule.length);
    const arrangementIndex = Math.floor(
      Math.random() * schedule[classIndex].arrangements.length
    );

    // 随机修改时间或教室
    if (Math.random() < 0.5) {
      schedule[classIndex].arrangements[arrangementIndex].timeSlot =
        this.getRandomTimeSlot();
    } else {
      const classObj = this.classes.find((c) =>
        c._id.equals(schedule[classIndex].classId)
      );
      schedule[classIndex].arrangements[arrangementIndex].classroomId =
        this.getRandomClassroom(classObj.studentCount)._id;
    }
  }

  // 获取随机合适的教室
  getRandomClassroom(studentCount) {
    const suitableClassrooms = this.classrooms.filter(
      (c) => c.capacity >= studentCount
    );
    return suitableClassrooms[
      Math.floor(Math.random() * suitableClassrooms.length)
    ];
  }

  // 获取随机时间段
  getRandomTimeSlot() {
    return Math.floor(Math.random() * 8) + 1; // 假设每天8节课
  }

  // 运行遗传算法
  async run() {
    let population = this.generateInitialPopulation();
    let bestSchedule = null;
    let bestFitness = -1;

    for (let generation = 0; generation < this.generations; generation++) {
      population = this.selection(population);

      // 评估当前种群中的最佳解
      for (const schedule of population) {
        const fitness = this.evaluateFitness(schedule);
        if (fitness > bestFitness) {
          bestFitness = fitness;
          bestSchedule = schedule;
        }
      }

      // 如果找到完美解，提前结束
      if (bestFitness === 100) {
        break;
      }
    }

    return this.convertScheduleToDBFormat(bestSchedule);
  }

  // 将排课结果转换为数据库格式
  convertScheduleToDBFormat(schedule) {
    const result = [];

    for (const classSchedule of schedule) {
      const classArrangements = {
        classId: classSchedule.classId,
        courses: [],
      };

      for (const arr of classSchedule.arrangements) {
        classArrangements.courses.push({
          course: arr.courseId,
          classroom: arr.classroomId,
          schedule: [
            {
              dayOfWeek: arr.dayOfWeek,
              startTime: this.getTimeBySlot(arr.timeSlot).startTime,
              endTime: this.getTimeBySlot(arr.timeSlot).endTime,
            },
          ],
        });
      }

      result.push(classArrangements);
    }

    return result;
  }

  // 根据课节取具体时间
  getTimeBySlot(slot) {
    const timeSlots = {
      1: { startTime: "08:00", endTime: "08:45" },
      2: { startTime: "08:55", endTime: "09:40" },
      3: { startTime: "10:00", endTime: "10:45" },
      4: { startTime: "10:55", endTime: "11:40" },
      5: { startTime: "14:00", endTime: "14:45" },
      6: { startTime: "14:55", endTime: "15:40" },
      7: { startTime: "16:00", endTime: "16:45" },
      8: { startTime: "16:55", endTime: "17:40" },
    };
    return timeSlots[slot];
  }
}

module.exports = SchedulingAlgorithm;
