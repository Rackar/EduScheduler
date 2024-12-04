const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  creditHours: {
    type: Number,
    required: true,
    min: 0,
  },
  linkedSlots: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
    },
  ],
});

const scheduleTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    periods: {
      morning: [timeSlotSchema],
      afternoon: [timeSlotSchema],
      evening: [timeSlotSchema],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 确保每个学校只有一个默认模板
scheduleTemplateSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      {
        school: this.school,
        _id: { $ne: this._id },
        isDefault: true,
      },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model("ScheduleTemplate", scheduleTemplateSchema);
