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
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: false,
    },
    fixedClassroom: {
      building: { type: String },
      room: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// 创建复合索引
scheduleSchema.index({ week: 1, day: 1, timeSlot: 1 });
scheduleSchema.index({ teacher: 1, week: 1, day: 1, timeSlot: 1 });
scheduleSchema.index({ classroom: 1, week: 1, day: 1, timeSlot: 1 });
scheduleSchema.index({ course: 1, week: 1 });

module.exports = mongoose.model("Schedule", scheduleSchema);
