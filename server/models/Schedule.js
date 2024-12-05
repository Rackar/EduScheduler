const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    week: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    day: {
      type: String,
      required: true,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
    timeSlot: {
      type: String,
      required: true,
      enum: ["1-2", "3-4", "5-6", "7-8", "9-10"],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: false,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScheduleTemplate",
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 创建复合索引
scheduleSchema.index({ week: 1, day: 1, timeSlot: 1 });
scheduleSchema.index({ teacherId: 1, week: 1, day: 1, timeSlot: 1 });
scheduleSchema.index({ classroomId: 1, week: 1, day: 1, timeSlot: 1 });
scheduleSchema.index({ classId: 1, week: 1, day: 1, timeSlot: 1 });
scheduleSchema.index({ courseId: 1, week: 1 });
scheduleSchema.index({ school: 1 });
scheduleSchema.index({ tenant: 1 });

// 添加 toJSON 转换
scheduleSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    // 转换关联字段的 ID
    if (ret.courseId && typeof ret.courseId === "object") {
      ret.courseId.id = ret.courseId._id.toString();
      delete ret.courseId._id;
    }
    if (ret.teacherId && typeof ret.teacherId === "object") {
      ret.teacherId.id = ret.teacherId._id.toString();
      delete ret.teacherId._id;
    }
    if (ret.classId && typeof ret.classId === "object") {
      ret.classId.id = ret.classId._id.toString();
      delete ret.classId._id;
    }
    if (ret.classroomId && typeof ret.classroomId === "object") {
      ret.classroomId.id = ret.classroomId._id.toString();
      delete ret.classroomId._id;
    }

    return ret;
  },
});

module.exports = mongoose.model("Schedule", scheduleSchema);
