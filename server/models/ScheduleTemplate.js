const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  startTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  creditHours: {
    type: Number,
    required: true,
    min: 0,
  },
});

const scheduleTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    periods: {
      morning: [timeSlotSchema],
      afternoon: [timeSlotSchema],
      evening: [timeSlotSchema],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 确保每个学校只有一个活动模板
scheduleTemplateSchema.pre("save", async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      {
        school: this.school,
        _id: { $ne: this._id },
      },
      { isActive: false }
    );
  }
  next();
});

// 添加 toJSON 转换
scheduleTemplateSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    // 转换时段中的 _id
    ["morning", "afternoon", "evening"].forEach((period) => {
      if (ret.periods && ret.periods[period]) {
        ret.periods[period] = ret.periods[period].map((slot) => ({
          ...slot,
          id: slot._id.toString(),
          _id: undefined,
        }));
      }
    });

    return ret;
  },
});

module.exports = mongoose.model("ScheduleTemplate", scheduleTemplateSchema);
