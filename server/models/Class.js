const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: false,
      default: "土木工程学院",
    },
    grade: {
      type: String,
      required: false,
      default: "2024级",
    },
    academicYear: {
      type: String,
      required: false,
      default: "2024",
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
    headTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
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
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Class", classSchema);
