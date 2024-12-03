const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    credit: { type: Number, required: true },
    hours: { type: Number, required: true },
    type: { type: String, required: true },
    department: { type: String, required: true },
    description: { type: String },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
    className: { type: String },
    studentCount: { type: Number, default: 0 },
    defaultClassroom: {
      building: { type: String },
      room: { type: String },
    },
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

courseSchema.index({ code: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ deletedAt: 1 });

courseSchema.pre("validate", function (next) {
  if (this.weeks && this.weeks.start > this.weeks.end) {
    next(new Error("开始周次不能大于结束周次"));
  }
  next();
});

module.exports = mongoose.model("Course", courseSchema);
