const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    // 租户和学校信息
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

    // 课程信息
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 时间信息
    timeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScheduleTemplate.periods",
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
      comment: "1-7 代表周一到周日",
    },
    weeks: [
      {
        type: Number,
        required: true,
        min: 1,
        max: 30,
      },
    ],

    // 状态信息
    status: {
      type: String,
      required: true,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    version: {
      type: Number,
      default: 1,
    },
    semester: {
      type: String,
      required: true,
    },

    // 其他信息
    description: String,
    meta: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 索引
scheduleSchema.index({ courseId: 1, classId: 1, weeks: 1 });
scheduleSchema.index({ teacherId: 1, dayOfWeek: 1, timeSlotId: 1 });
scheduleSchema.index({ school: 1, semester: 1, status: 1 });

// 虚拟字段
scheduleSchema.virtual("course", {
  ref: "Course",
  localField: "courseId",
  foreignField: "_id",
  justOne: true,
});

scheduleSchema.virtual("class", {
  ref: "Class",
  localField: "classId",
  foreignField: "_id",
  justOne: true,
});

scheduleSchema.virtual("teacher", {
  ref: "User",
  localField: "teacherId",
  foreignField: "_id",
  justOne: true,
});

scheduleSchema.virtual("timeSlot", {
  ref: "ScheduleTemplate",
  localField: "timeSlotId",
  foreignField: "periods._id",
  justOne: true,
});

// 方法
scheduleSchema.methods = {
  // 检查时间冲突
  async checkConflict() {
    const Schedule = this.constructor;
    return await Schedule.findOne({
      _id: { $ne: this._id },
      $or: [
        // 教师在同一时间段已有课程
        {
          teacherId: this.teacherId,
          dayOfWeek: this.dayOfWeek,
          timeSlotId: this.timeSlotId,
          weeks: { $in: this.weeks },
        },
        // 班级在同一时间段已有课程
        {
          classId: this.classId,
          dayOfWeek: this.dayOfWeek,
          timeSlotId: this.timeSlotId,
          weeks: { $in: this.weeks },
        },
      ],
    });
  },
};

// 静态方法
scheduleSchema.statics = {
  // 获取指定周次的课表
  async getWeekSchedule(schoolId, week, options = {}) {
    return this.find({
      school: schoolId,
      weeks: week,
      ...options,
    })
      .populate("course")
      .populate("class")
      .populate("teacher")
      .populate("timeSlot")
      .sort({ dayOfWeek: 1, "timeSlot.startTime": 1 });
  },
};

const Schedule2 = mongoose.model("Schedule2", scheduleSchema);

module.exports = Schedule2;
