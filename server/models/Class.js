const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    grade: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    courses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        classroom: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Classroom",
        },
        schedule: [
          {
            dayOfWeek: Number, // 1-7 表示周一到周日
            startTime: String, // 格式 "HH:mm"
            endTime: String, // 格式 "HH:mm"
          },
        ],
      },
    ],
    headTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    academicYear: {
      type: String,
      required: true,
    },
    studentCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// 添加索引以优化查询性能
classSchema.index({ name: 1, academicYear: 1 });
classSchema.index({ department: 1 });

module.exports = mongoose.model("Class", classSchema);
