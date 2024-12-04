const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: function () {
        return !this.roles.includes("super_admin");
      },
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: function () {
        return !this.roles.includes("super_admin");
      },
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: String,
    avatar: String,
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    roles: [
      {
        type: String,
        enum: [
          "super_admin",
          "tenant_admin",
          "school_admin",
          "scheduler",
          "teacher",
          "student",
        ],
        required: true,
      },
    ],
    profile: {
      department: String,
      title: String,
      teachingHours: {
        current: { type: Number, default: 0 },
        min: { type: Number, default: 14 },
        max: { type: Number, default: 16 },
      },
      courses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      ],
    },
    preferences: {
      theme: {
        type: String,
        default: "light",
      },
      notifications: {
        email: { type: Boolean, default: true },
        web: { type: Boolean, default: true },
      },
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// 确保在同一租户下用户名唯一（排除超级管理员）
userSchema.index(
  { tenant: 1, username: 1 },
  {
    unique: true,
    partialFilterExpression: {
      tenant: { $exists: true },
    },
  }
);

// 确保在同一租户下邮箱唯一（排除超级管理员）
userSchema.index(
  { tenant: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      tenant: { $exists: true },
    },
  }
);

// 密码加密中间件
userSchema.pre("save", async function (next) {
  // 如果密码没有修改，或者指定了跳过加密，则不进行加密
  if (
    !this.isModified("password") ||
    this.$__.saveOptions?.skipPasswordHashing
  ) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 验证密码方法
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log("\n=== 密码验证详情 ===");
  console.log("输入的密码:", enteredPassword);
  console.log("数据库中的密码哈希:", this.password);

  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log("bcrypt.compare 结果:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("密码验证出错:", error);
    return false;
  }
};

// 检查是否是超级管理员
userSchema.methods.isSuperAdmin = function () {
  return this.roles.includes("super_admin");
};

// 检查是否是租户管理员
userSchema.methods.isTenantAdmin = function () {
  return this.roles.includes("tenant_admin");
};

// 检查是否是学校管理员
userSchema.methods.isSchoolAdmin = function () {
  return this.roles.includes("school_admin");
};

// 检查是否是排课管理员
userSchema.methods.isScheduler = function () {
  return this.roles.includes("scheduler");
};

// 检查是否是教师
userSchema.methods.isTeacher = function () {
  return this.roles.includes("teacher");
};

// 检查是否是学生
userSchema.methods.isStudent = function () {
  return this.roles.includes("student");
};

// 添加 toJSON 转换
userSchema.set("toJSON", {
  transform: function (doc, ret, options) {
    // 转换 _id
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    // 处理嵌套的 ObjectId
    if (ret.tenant) {
      ret.tenant = ret.tenant.toString();
    }
    if (ret.school) {
      ret.school = ret.school.toString();
    }

    // 处理课程数据
    if (ret.profile && ret.profile.courses) {
      ret.profile.courses = ret.profile.courses.map((course) => {
        if (typeof course === "object" && course._id) {
          return {
            ...course,
            id: course._id.toString(),
            _id: undefined,
          };
        }
        return course.toString();
      });
    }

    // 确保不返回密码
    delete ret.password;

    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
