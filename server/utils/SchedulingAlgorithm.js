class SchedulingAlgorithm {
  constructor(
    teachers,
    courses,
    classrooms,
    startWeek,
    endWeek,
    priority = "teacher",
    considerClassroom = true
  ) {
    this.teachers = teachers;
    this.courses = courses;
    this.classrooms = classrooms;
    this.startWeek = startWeek;
    this.endWeek = endWeek;
    this.priority = priority;
    this.considerClassroom = considerClassroom;
  }

  // 运行贪心算法进行排课
  async run() {
    try {
      console.log("开始排课...");
      console.log(`总课程数: ${this.courses.length}`);
      console.log(`总教师数: ${this.teachers.length}`);
      console.log(`总教室数: ${this.classrooms.length}`);
      console.log(`排课周次: ${this.startWeek}-${this.endWeek}`);

      // 按班级分组课程
      const coursesByClass = this.groupCoursesByClass();
      console.log("课程已按班级分组");

      const schedule = [];
      const teacherTimeSlots = new Map(); // 用于跟踪教师已用时间段
      const classTimeSlots = new Map(); // 用于跟踪班级已用时间段
      const classroomTimeSlots = new Map(); // 用于跟踪教室已用时间段

      // 为每个班级排课
      for (const [classId, classCourses] of coursesByClass.entries()) {
        console.log(
          `正在为班级 ${classId} 排课，共 ${classCourses.length} 门课程`
        );

        // 对班级内的课程进行排序
        const sortedCourses = this.sortCoursesByPriority(classCourses);

        // 为该班级的每门课程安排时间
        for (const course of sortedCourses) {
          const arrangement = await this.arrangeCourse(
            course,
            teacherTimeSlots,
            classTimeSlots,
            classroomTimeSlots,
            classId
          );

          if (arrangement) {
            schedule.push(...arrangement);
          }
        }
      }

      return schedule;
    } catch (error) {
      console.error("排课过程中出错:", error);
      throw error;
    }
  }

  // 按班级分组课程
  groupCoursesByClass() {
    const coursesByClass = new Map();

    for (const course of this.courses) {
      if (course.classes && course.classes.length > 0) {
        for (const classId of course.classes) {
          if (!coursesByClass.has(classId.toString())) {
            coursesByClass.set(classId.toString(), []);
          }
          coursesByClass.get(classId.toString()).push(course);
        }
      } else {
        // 对于没有指定班级的课程，放入默认组
        const defaultGroup = "unassigned";
        if (!coursesByClass.has(defaultGroup)) {
          coursesByClass.set(defaultGroup, []);
        }
        coursesByClass.get(defaultGroup).push(course);
      }
    }

    return coursesByClass;
  }

  // 按优先级对课程进行排序
  sortCoursesByPriority(courses) {
    return [...courses].sort((a, b) => {
      // 首先按照课时数降序排序
      const hoursDiff = (b.hours || 0) - (a.hours || 0);
      if (hoursDiff !== 0) return hoursDiff;

      // 然后按照学生人数降序排序
      const studentCountDiff = (b.studentCount || 0) - (a.studentCount || 0);
      if (studentCountDiff !== 0) return studentCountDiff;

      // 最后按照课程代码排序
      return (a.code || "").localeCompare(b.code || "");
    });
  }

  // 为单个课程安排时间
  async arrangeCourse(
    course,
    teacherTimeSlots,
    classTimeSlots,
    classroomTimeSlots,
    classId
  ) {
    console.log(`正在安排课程: ${course.name} (班级: ${classId})`);

    const teacher = course.teacher;
    if (!teacher) {
      console.warn(`课程 ${course.name} 没有指定教师，跳过`);
      return null;
    }

    // 初始化时间槽记录
    if (!teacherTimeSlots.has(teacher._id.toString())) {
      teacherTimeSlots.set(teacher._id.toString(), new Set());
    }
    if (!classTimeSlots.has(classId)) {
      classTimeSlots.set(classId, new Set());
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

    if (courseStartWeek > courseEndWeek) {
      console.warn(`课程 ${course.name} 的周次范围不在排课范围内，跳过`);
      return null;
    }

    // 查找合适的时间段
    const arrangement = this.findSuitableTimeSlot(
      course,
      teacher,
      courseStartWeek,
      courseEndWeek,
      teacherTimeSlots,
      classTimeSlots,
      classroomTimeSlots,
      classId
    );

    if (!arrangement) {
      console.warn(`无法为课程 ${course.name} 找到合适的时间段`);
      return null;
    }

    // 创建课程安排
    const scheduleItems = [];
    for (let week = courseStartWeek; week <= courseEndWeek; week++) {
      const timeKey = `${week}-${arrangement.day}-${arrangement.timeSlot}`;

      // 标记时间段为已使用
      teacherTimeSlots.get(teacher._id.toString()).add(timeKey);
      classTimeSlots.get(classId).add(timeKey);

      if (arrangement.classroom) {
        if (!classroomTimeSlots.has(arrangement.classroom._id.toString())) {
          classroomTimeSlots.set(
            arrangement.classroom._id.toString(),
            new Set()
          );
        }
        classroomTimeSlots
          .get(arrangement.classroom._id.toString())
          .add(timeKey);
      }

      scheduleItems.push({
        week,
        day: arrangement.day,
        timeSlot: arrangement.timeSlot,
        course: course._id,
        teacher: teacher._id,
        classroom: arrangement.classroom?._id,
        class: classId,
      });
    }

    console.log(
      `成功为课程 ${course.name} 安排时间: ${arrangement.day} ${arrangement.timeSlot}`
    );
    return scheduleItems;
  }

  // 查找合适的时间段
  findSuitableTimeSlot(
    course,
    teacher,
    startWeek,
    endWeek,
    teacherTimeSlots,
    classTimeSlots,
    classroomTimeSlots,
    classId
  ) {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const timeSlots = ["1-2", "3-4", "5-6", "7-8", "9-10"];

    for (const day of days) {
      for (const timeSlot of timeSlots) {
        // 检查教师和班级在这个时间是否都可用
        const timeAvailable = !Array.from(
          { length: endWeek - startWeek + 1 },
          (_, i) => startWeek + i
        ).some((week) => {
          const timeKey = `${week}-${day}-${timeSlot}`;
          return (
            teacherTimeSlots.get(teacher._id.toString()).has(timeKey) ||
            classTimeSlots.get(classId).has(timeKey)
          );
        });

        if (!timeAvailable) continue;

        // 如果需要考虑教室
        if (this.considerClassroom) {
          const suitableClassroom = this.findSuitableClassroom(
            course.studentCount,
            startWeek,
            endWeek,
            day,
            timeSlot,
            classroomTimeSlots
          );

          if (suitableClassroom) {
            return { day, timeSlot, classroom: suitableClassroom };
          }
        } else {
          return { day, timeSlot };
        }
      }
    }

    return null;
  }

  // 查找合适的教室
  findSuitableClassroom(
    studentCount,
    startWeek,
    endWeek,
    day,
    timeSlot,
    classroomTimeSlots
  ) {
    const sortedClassrooms = [...this.classrooms].sort(
      (a, b) => a.capacity - b.capacity
    );

    for (const classroom of sortedClassrooms) {
      if (classroom.capacity < (studentCount || 0)) continue;

      const isClassroomAvailable = !Array.from(
        { length: endWeek - startWeek + 1 },
        (_, i) => startWeek + i
      ).some((week) => {
        const timeKey = `${week}-${day}-${timeSlot}`;
        return classroomTimeSlots.get(classroom._id.toString())?.has(timeKey);
      });

      if (isClassroomAvailable) {
        return classroom;
      }
    }

    return null;
  }
}

module.exports = SchedulingAlgorithm;
