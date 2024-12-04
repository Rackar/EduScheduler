const Course = require("../models/Course");
const User = require("../models/User");
const Class = require("../models/Class");
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

// 更新课程信息
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
exports.batchImportCourses = asyncHandler(async (req, res) => {
  const { courses } = req.body;
  const results = {
    success: [],
    errors: [],
  };

  console.log("开始导入课程，总数:", courses.length);

  for (const courseData of courses) {
    try {
      console.log(
        "处理课程:",
        courseData.name,
        "班级信息:",
        courseData.className
      );

      // 处理周次信息
      let weeks = {
        start: 1,
        end: 20,
      };

      if (courseData.weeks) {
        if (typeof courseData.weeks === "string") {
          const match = courseData.weeks.match(/(\d+)-(\d+)/);
          if (match) {
            weeks.start = parseInt(match[1]);
            weeks.end = parseInt(match[2]);
          }
        } else if (typeof courseData.weeks === "object") {
          weeks = {
            start: parseInt(courseData.weeks.start) || 1,
            end: parseInt(courseData.weeks.end) || 20,
          };
        }
      }

      // 查找或创建教师
      let teacher = null;
      if (courseData.teacherName) {
        teacher = await User.findOne({
          tenant: req.user.tenant,
          school: req.user.school,
          name: courseData.teacherName,
          roles: { $in: ["teacher"] },
        });

        if (!teacher) {
          const username = `${courseData.teacherName}${Date.now()}`;
          teacher = await User.create({
            tenant: req.user.tenant,
            school: req.user.school,
            username,
            name: courseData.teacherName,
            email: `${username}@example.com`,
            password: "123456", // 默认密码
            roles: ["teacher"],
          });
        }
      }

      // 处理班级信息
      let classIds = [];
      let parsedClasses = [];
      if (courseData.className) {
        console.log("解析班级名称:", courseData.className);
        parsedClasses = Class.parseClassNames(
          courseData.className,
          courseData.studentCount
        );
        console.log("解析结果:", parsedClasses);

        for (const classInfo of parsedClasses) {
          console.log("处理班级:", classInfo.name);
          let classDoc = await Class.findOne({
            tenant: req.user.tenant,
            school: req.user.school,
            name: classInfo.name,
          });

          if (!classDoc) {
            console.log("创建新班级:", classInfo.name);
            classDoc = await Class.create({
              tenant: req.user.tenant,
              school: req.user.school,
              ...classInfo,
            });
            console.log("班级创建成功:", classDoc._id);
          } else {
            // 更新现有班级的学生人数
            if (
              classInfo.studentCount &&
              classInfo.studentCount !== classDoc.studentCount
            ) {
              classDoc.studentCount = classInfo.studentCount;
              await classDoc.save();
            }
            console.log("找到现有班级:", classDoc._id);
          }

          classIds.push(classDoc._id);
        }
      }

      // 创建课程
      const course = await Course.create({
        tenant: req.user.tenant,
        school: req.user.school,
        name: courseData.name,
        code: courseData.code,
        credit: parseFloat(courseData.credit) || 2,
        hours: parseInt(courseData.hours) || 32,
        type: courseData.type || "必修课",
        department:
          courseData.department || teacher?.profile?.department || "未知",
        teacher: teacher?._id,
        classes: classIds,
        semester: courseData.semester,
        weeks,
      });

      console.log("课程创建成功:", course._id);

      // 更新教师的课程列表
      if (teacher) {
        teacher.profile = teacher.profile || {};
        teacher.profile.courses = teacher.profile.courses || [];
        teacher.profile.courses.push(course._id);
        await teacher.save();
        console.log("更新教师课程列表成功");
      }

      // 更新班级的课程列表
      if (classIds.length > 0) {
        console.log("更新班级课程列表:", classIds);
        const updateResult = await Class.updateMany(
          { _id: { $in: classIds } },
          { $addToSet: { courses: course._id } }
        );
        console.log("班级更新结果:", updateResult);
      }

      results.success.push({
        name: course.name,
        code: course.code,
        teacher: teacher?.name,
        classes: parsedClasses.map((c) => c.name),
      });
    } catch (error) {
      console.error("处理课程失败:", error);
      results.errors.push({
        name: courseData.name,
        error: error.message,
      });
    }
  }

  res.status(201).json(results);
});
