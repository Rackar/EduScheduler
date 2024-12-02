const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // 例如："第一节"，"第二节"
  },
  startTime: {
    type: String,
    required: true, // 格式 "HH:mm"
  },
  endTime: {
    type: String,
    required: true, // 格式 "HH:mm"
  },
  type: {
    type: String,
    enum: ["morning", "afternoon", "evening"],
    required: true,
  },
  order: {
    type: Number,
    required: true, // 用于排序，例如：1, 2, 3...
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  breakTime: {
    duration: Number, // 课间休息时长（分钟）
    isLongBreak: {
      // 是否为大课间
      type: Boolean,
      default: false,
    },
  },
});

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
