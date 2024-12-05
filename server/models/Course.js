const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    name: { type: String, required: true },
    code: { type: String, required: true },
    credit: { type: Number, required: true },
    hours: { type: Number, required: true },
    type: { type: String, required: true },
    department: { type: String, required: true },
    description: { type: String },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active",
    },
    semester: {
      type: String,
      default: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        return `${year}${month <= 7 ? "春季" : "秋季"}`;
      },
    },
    studentCount: { type: Number, default: 0 },
    weeks: {
      start: { type: Number, required: true, min: 1, max: 20 },
      end: { type: Number, required: true, min: 1, max: 20 },
    },
    version: { type: Number, default: 1 },
    previousVersion: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    deletedAt: { type: Date, default: null },
    deletedReason: { type: String },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ tenant: 1, school: 1, code: 1 }, { unique: true });
courseSchema.index({ tenant: 1, school: 1, status: 1 });
courseSchema.index({ tenant: 1, school: 1, deletedAt: 1 });

courseSchema.pre("validate", function (next) {
  if (this.weeks && this.weeks.start > this.weeks.end) {
    next(new Error("开始周次不能大于结束周次"));
  }
  next();
});

courseSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    if (ret.teacher) {
      ret.teacher =
        typeof ret.teacher === "object"
          ? { ...ret.teacher, id: ret.teacher._id.toString(), _id: undefined }
          : ret.teacher.toString();
    }

    if (ret.classes) {
      ret.classes = ret.classes.map((cls) =>
        typeof cls === "object"
          ? { ...cls, id: cls._id.toString(), _id: undefined }
          : cls.toString()
      );
    }

    if (ret.previousVersion) {
      ret.previousVersion = ret.previousVersion.toString();
    }

    return ret;
  },
});

// 静态方法：解析课时字符串
courseSchema.statics.parseHours = function (hoursString) {
  if (!hoursString) return null;

  // 处理简单的数字格式
  if (/^\d+$/.test(hoursString)) {
    return parseInt(hoursString);
  }

  // 处理 "2:0-0.0" 或 "2.0-0.0" 格式
  const match = hoursString.toString().match(/^(\d+(?:\.\d+)?)[:\-]?/);
  if (match) {
    return parseInt(match[1]);
  }

  return null;
};

module.exports = mongoose.model("Course", courseSchema);
