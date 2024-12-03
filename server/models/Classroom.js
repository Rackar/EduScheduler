const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    building: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ["普通教室", "多媒体教室", "实验室", "阶梯教室"],
      default: "普通教室",
    },
    equipment: [
      {
        type: String,
        enum: ["投影仪", "电脑", "音响", "实验设备", "白板"],
      },
    ],
    status: {
      type: String,
      enum: ["可用", "维修中", "已预约"],
      default: "可用",
    },
  },
  {
    timestamps: true,
  }
);

// 创建复合索引
classroomSchema.index({ building: 1, room: 1 }, { unique: true });
classroomSchema.index({ capacity: 1 });
classroomSchema.index({ type: 1 });
classroomSchema.index({ status: 1 });

module.exports = mongoose.model("Classroom", classroomSchema);
