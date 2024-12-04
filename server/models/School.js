const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    address: {
      type: String,
      required: true,
    },
    contact: {
      name: String,
      phone: String,
      email: String,
    },
    settings: {
      defaultScheduleTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ScheduleTemplate",
      },
      academicYear: {
        start: Date,
        end: Date,
      },
      terms: [
        {
          name: String,
          start: Date,
          end: Date,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// 确保在同一租户下学校代码唯一
schoolSchema.index({ tenant: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("School", schoolSchema);
