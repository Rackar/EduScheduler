const Course = require("../models/Course");
const User = require("../models/User");
const Class = require("../models/Class");
const Schedule2 = require("../models/Schedule2");
const asyncHandler = require("express-async-handler");

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
      tenant: req.user.tenant,
      school: req.user.school,
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

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("teacher", "username name department")
        .populate("previousVersion", "version code name")
        .skip(skip)
        .limit(parseInt(size))
        .sort({ createdAt: -1 }),
      Course.countDocuments(filter),
    ]);

    // 格式化返回数据
    const formattedCourses = courses.map((course) => ({
      ...course.toObject(),
      teacherName: course.teacher?.name,
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
    res.status(500).json({
      message: "获取课程列表失败",
      error: error.message,
    });
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
    const courseData = {
      ...req.body,
      tenant: req.user.tenant,
      school: req.user.school,
    };

    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      message: "创建课程成功",
      data: course,
    });
  } catch (error) {
    console.error("创建课程失败:", error);
    res.status(400).json({
      message: "创建课程失败",
      error: error.message,
    });
  }
};

// 更新课程
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const currentCourse = await Course.findOne({
      _id: id,
      tenant: req.user.tenant,
      school: req.user.school,
    });

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
        tenant: req.user.tenant,
        school: req.user.school,
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
      const updatedCourse = await Course.findOneAndUpdate(
        {
          _id: id,
          tenant: req.user.tenant,
          school: req.user.school,
        },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

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

    const course = await Course.findOne({
      _id: id,
      tenant: req.user.tenant,
      school: req.user.school,
    });

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

// @desc    批量导入课程
// @route   POST /api/courses/batch-import
// @access  Private/Admin
exports.batchImportCourses = async (req, res) => {
  try {
    const { courses } = req.body;
    const importedCourses = [];
    const errors = [];

    for (const course of courses) {
      try {
        // 解析课时信息
        const weeklyHours = Course.parseHours(course.hours);
        if (weeklyHours === null) {
          throw new Error(`课时格式无效: ${course.hours}`);
        }

        // 解析周次信息
        let weeks = { start: 1, end: 20 };
        if (course.weeks) {
          const weekMatch = course.weeks.match(/^(\d+)-(\d+)$/);
          if (weekMatch) {
            weeks = {
              start: parseInt(weekMatch[1]),
              end: parseInt(weekMatch[2]),
            };
          }
        }

        // 查找或创建教师
        let teacher = null;
        if (course.teacherName) {
          teacher = await User.findOne({
            tenant: req.user.tenant,
            school: req.user.school,
            name: course.teacherName,
            roles: { $in: ["teacher"] },
          });

          if (!teacher) {
            const username = `${course.teacherName}${Date.now()}`;
            teacher = await User.create({
              tenant: req.user.tenant,
              school: req.user.school,
              username,
              name: course.teacherName,
              email: `${username}@example.com`,
              password: "123456", // 默认密码
              roles: ["teacher"],
            });
          }
        }

        // 处理班级信息
        let classIds = [];
        if (course.className) {
          const classNames = course.className.split(/[,，]/);
          for (const className of classNames) {
            const trimmedName = className.trim();

            // 使用 Class.parseClassNames 处理班级名称（支持范围班级）
            const parsedClasses = Class.parseClassNames(
              trimmedName,
              course.studentCount
            );
            console.log("解析的班级:", parsedClasses);

            if (!parsedClasses.length) {
              throw new Error(`班级名称格式无效: ${trimmedName}`);
            }

            for (const classInfo of parsedClasses) {
              let classDoc = await Class.findOne({
                tenant: req.user.tenant,
                school: req.user.school,
                name: classInfo.name,
              });

              if (!classDoc) {
                classDoc = await Class.create({
                  tenant: req.user.tenant,
                  school: req.user.school,
                  ...classInfo,
                });
              } else if (
                classDoc.studentCount === 0 &&
                classInfo.studentCount > 0
              ) {
                // 只在原班级人数为0，且有新的人数时更新
                classDoc.studentCount = classInfo.studentCount;
                await classDoc.save();
              }

              classIds.push(classDoc._id);
            }
          }
        }

        // 创建课程
        const newCourse = await Course.create({
          tenant: req.user.tenant,
          school: req.user.school,
          name: course.name,
          code: course.code || `C${Date.now()}`,
          credit: parseFloat(course.credit) || weeklyHours,
          hours: weeklyHours,
          type: course.type || "必修",
          department: course.department || "未分类",
          description: course.description,
          teacher: teacher?._id,
          classes: classIds,
          weeks,
          status: "active",
        });

        // 更新教师的课程列表
        if (teacher) {
          teacher.profile = teacher.profile || {};
          teacher.profile.courses = teacher.profile.courses || [];
          teacher.profile.courses.push(newCourse._id);
          await teacher.save();
        }

        // 更新班级的课程列表
        if (classIds.length > 0) {
          await Class.updateMany(
            { _id: { $in: classIds } },
            { $addToSet: { courses: newCourse._id } }
          );
        }

        importedCourses.push({
          name: newCourse.name,
          code: newCourse.code,
          teacher: teacher?.name,
          classes: classIds.length
            ? await Class.find({ _id: { $in: classIds } }).distinct("name")
            : [],
        });
      } catch (error) {
        console.error("导入课程失败:", course, error);
        errors.push({
          name: course.name,
          error: error.message,
        });
      }
    }

    res.json({
      success: importedCourses,
      errors,
    });
  } catch (error) {
    console.error("批量导入课程失败:", error);
    res.status(500).json({
      success: false,
      message: "批量导入课程失败",
      error: error.message,
    });
  }
};

// 清除所有数据
exports.clearAllData = async (req, res) => {
  try {
    const { tenant, school } = req.user;

    // 清空所有相关集合
    const [courseResult, classResult, scheduleResult, teacherResult] =
      await Promise.all([
        Course.deleteMany({ tenant, school }),
        Class.deleteMany({ tenant, school }),
        Schedule2.deleteMany({ tenant, school }),
        User.deleteMany({
          tenant,
          school,
          roles: { $in: ["teacher"] },
        }),
      ]);

    res.json({
      message: "清除数据成功",
      deletedCount: {
        courses: courseResult.deletedCount,
        classes: classResult.deletedCount,
        schedules: scheduleResult.deletedCount,
        teachers: teacherResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("清除数据失败:", error);
    res.status(500).json({
      message: "清除数据失败",
      error: error.message,
    });
  }
};
