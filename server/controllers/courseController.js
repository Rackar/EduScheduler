const Course = require("../models/Course");
const User = require("../models/User");

// 获取所有课程
exports.getAllCourses = async (req, res) => {
  try {
    const {
      page = 1,
      size = 10,
      query = "",
      includeInactive = false,
    } = req.query;
    const skip = (page - 1) * size;

    // 构建查询条件
    const filter = {
      status: includeInactive ? { $in: ["active", "inactive"] } : "active",
    };

    // 添加搜索条件
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { code: { $regex: query, $options: "i" } },
        { department: { $regex: query, $options: "i" } },
      ];
    }

    console.log("查询条件:", filter);

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("teacher", "username department")
        .populate("previousVersion", "version code name")
        .skip(skip)
        .limit(parseInt(size))
        .sort({ createdAt: -1 }),
      Course.countDocuments(filter),
    ]);

    // 格式化返回数据
    const formattedCourses = courses.map((course) => ({
      ...course.toObject(),
      teacherName: course.teacher?.username,
      teacherDepartment: course.teacher?.department,
      previousVersionInfo: course.previousVersion
        ? {
            version: course.previousVersion.version,
            code: course.previousVersion.code,
            name: course.previousVersion.name,
          }
        : null,
    }));

    res.json({
      items: formattedCourses,
      total,
      page: parseInt(page),
      size: parseInt(size),
      activeOnly: !includeInactive,
    });
  } catch (error) {
    console.error("获取课程列表失败:", error);
    res.status(500).json({ message: "获取课程列表失败", error: error.message });
  }
};

// 获取单个课程详情
exports.getCourseDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .populate("teacher", "username department")
      .populate("previousVersion", "version code name");

    if (!course) {
      return res.status(404).json({ message: "课程不存在" });
    }

    // 获取课程的所有历史版本
    const history = await Course.find({
      code: course.code,
      _id: { $ne: course._id },
    })
      .select("version code name status createdAt deletedAt deletedReason")
      .sort({ version: -1 });

    const formattedCourse = {
      ...course.toObject(),
      teacherName: course.teacher?.username,
      teacherDepartment: course.teacher?.department,
      previousVersionInfo: course.previousVersion
        ? {
            version: course.previousVersion.version,
            code: course.previousVersion.code,
            name: course.previousVersion.name,
          }
        : null,
      history,
    };

    res.json(formattedCourse);
  } catch (error) {
    console.error("获取课程详情失败:", error);
    res.status(500).json({ message: "获取课程详情失败", error: error.message });
  }
};

// 创建新课程
exports.createCourse = async (req, res) => {
  try {
    // 检查是否存在相同代码的活动课程
    const existingCourse = await Course.findOne({
      code: req.body.code,
      status: "active",
    });

    if (existingCourse) {
      return res.status(400).json({
        message: "已存在相同代码的活动课程",
        existingCourse,
      });
    }

    const courseData = {
      ...req.body,
      status: "active",
    };

    const newCourse = new Course(courseData);
    await newCourse.save();

    res.status(201).json({
      message: "创建课程成功",
      data: newCourse,
    });
  } catch (error) {
    console.error("创建课程失败:", error);
    res.status(400).json({
      message: "创建课程失败",
      error: error.message,
    });
  }
};

// 更新课程信息
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const currentCourse = await Course.findById(id);

    if (!currentCourse) {
      return res.status(404).json({ message: "课程不存在" });
    }

    if (currentCourse.status !== "active") {
      return res.status(400).json({ message: "只能更新活动状态的课程" });
    }

    // 如果更新了关键信息，创建新版本
    const isSignificantUpdate = [
      "name",
      "code",
      "credit",
      "hours",
      "type",
      "department",
      "teacher",
    ].some(
      (field) =>
        req.body[field] &&
        req.body[field].toString() !== currentCourse[field]?.toString()
    );

    if (isSignificantUpdate) {
      // 将当前课程标记为非活动
      currentCourse.status = "inactive";
      currentCourse.deletedAt = new Date();
      currentCourse.deletedReason = "被新版本替换";
      await currentCourse.save();

      // 创建新版本
      const newCourse = new Course({
        ...req.body,
        version: currentCourse.version + 1,
        previousVersion: currentCourse._id,
        status: "active",
      });
      await newCourse.save();

      res.json({
        message: "更新课程成功（创建新版本）",
        data: newCourse,
        previousVersion: currentCourse._id,
      });
    } else {
      // 小改动直接更新
      const updatedCourse = await Course.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      res.json({
        message: "更新课程成功",
        data: updatedCourse,
      });
    }
  } catch (error) {
    console.error("更新课程失败:", error);
    res.status(400).json({
      message: "更新课程失败",
      error: error.message,
    });
  }
};

// 删除课程（软删除）
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "手动删除" } = req.body;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: "课程不存在" });
    }

    if (course.status === "deleted") {
      return res.status(400).json({ message: "课程已经被删除" });
    }

    course.status = "deleted";
    course.deletedAt = new Date();
    course.deletedReason = reason;
    await course.save();

    res.json({
      message: "课程已删除",
      data: course,
    });
  } catch (error) {
    console.error("删除课程失败:", error);
    res.status(500).json({
      message: "删除课程失败",
      error: error.message,
    });
  }
};

// 批量导入课程
exports.batchImportCourses = async (req, res) => {
  try {
    const { courses } = req.body;

    if (!Array.isArray(courses)) {
      return res.status(400).json({ message: "数据格式错误" });
    }

    const results = {
      created: [],
      updated: [],
      errors: [],
    };

    // 逐条处理数据
    for (const courseData of courses) {
      try {
        // 确保必需字段存在
        if (
          !courseData.teacherName ||
          !courseData.department ||
          !courseData.code
        ) {
          throw new Error("教师姓名、所属院系和课程代码是必需的");
        }

        // 处理周次信息
        let weeks = { start: 1, end: 20 }; // 默认值
        if (courseData.weekInfo) {
          try {
            // 确保 weekInfo 是字符串
            const weekInfoStr = String(courseData.weekInfo).trim();
            // 支持多种格式：2-16、2~16、第2-16周、2到16周等
            const weekMatch = weekInfoStr.match(/(\d+)[-~到至](\d+)/);

            if (weekMatch) {
              const start = parseInt(weekMatch[1]);
              const end = parseInt(weekMatch[2]);

              if (
                !isNaN(start) &&
                !isNaN(end) &&
                start > 0 &&
                end > 0 &&
                start <= end &&
                end <= 20
              ) {
                weeks = { start, end };
              } else {
                console.warn(
                  `课程 ${courseData.name} 的周次范围无效: ${weekInfoStr}，使用默认值`
                );
              }
            } else {
              // 尝试解析单个数字（如果只有一个周）
              const singleWeek = parseInt(weekInfoStr);
              if (!isNaN(singleWeek) && singleWeek > 0 && singleWeek <= 20) {
                weeks = { start: singleWeek, end: singleWeek };
              } else {
                console.warn(
                  `课程 ${courseData.name} 的周次格式无效: ${weekInfoStr}，使用默认值`
                );
              }
            }
          } catch (error) {
            console.warn(
              `处理课程 ${courseData.name} 的周次信息时出错:`,
              error
            );
          }
        }

        // 1. 查找或创建教师
        let teacher = await User.findOne({
          username: courseData.teacherName,
          role: "teacher",
        });

        if (!teacher) {
          teacher = await User.create({
            username: courseData.teacherName,
            password: "123456", // 默认密码
            role: "teacher",
            department: courseData.department,
            teachingHours: {
              current: 0,
              min: 14,
              max: 16,
            },
          });
        }

        // 2. 查找是否存在相同代码的课程
        const existingCourse = await Course.findOne({
          code: courseData.code,
          status: "active",
        });

        let newCourse; // 声明在外部以便后续使用

        if (existingCourse) {
          // 将现有课程标记为非活动
          existingCourse.status = "inactive";
          existingCourse.deletedAt = new Date();
          existingCourse.deletedReason = "被新版本替换";
          await existingCourse.save();

          // 创建新版本的课程
          newCourse = await Course.create({
            name: courseData.name,
            code: courseData.code,
            credit: parseFloat(courseData.credit) || 0,
            hours: parseFloat(courseData.hours) || 0,
            type: courseData.type || "必修课",
            department: courseData.department,
            teacher: teacher._id,
            description: courseData.description || "",
            semester: courseData.semester || "2024春季",
            className: courseData.className || "",
            studentCount: parseInt(courseData.studentCount) || 0,
            weeks,
            version: existingCourse.version + 1,
            previousVersion: existingCourse._id,
          });

          results.updated.push({
            course: newCourse,
            teacher: teacher.username,
            previousVersion: existingCourse._id,
          });
        } else {
          // 创建新课程
          newCourse = await Course.create({
            name: courseData.name,
            code: courseData.code,
            credit: parseFloat(courseData.credit) || 0,
            hours: parseFloat(courseData.hours) || 0,
            type: courseData.type || "必修课",
            department: courseData.department,
            teacher: teacher._id,
            description: courseData.description || "",
            semester: courseData.semester || "2024春季",
            className: courseData.className || "",
            studentCount: parseInt(courseData.studentCount) || 0,
            weeks,
          });

          results.created.push({
            course: newCourse,
            teacher: teacher.username,
          });
        }

        // 3. 更新教师的课程列表（不管是新建还是更新）
        await User.findByIdAndUpdate(teacher._id, {
          $addToSet: { courses: newCourse._id },
        });
      } catch (error) {
        results.errors.push({
          data: courseData,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      message: "批量导入完成",
      data: {
        created: results.created.length,
        updated: results.updated.length,
        failed: results.errors.length,
        details: results,
      },
    });
  } catch (error) {
    console.error("批量导入失败:", error);
    res.status(400).json({
      message: "批量导入失败",
      error: error.message,
    });
  }
};
