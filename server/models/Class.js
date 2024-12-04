const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    grade: {
      type: Number,
      required: true,
    },
    classNumber: {
      type: Number,
      required: true,
    },
    studentCount: {
      type: Number,
      default: 0,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
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

classSchema.index({ school: 1, name: 1 }, { unique: true });

classSchema.statics.parseClassNames = function (classNameString) {
  if (!classNameString) return [];

  const classNames = [];
  const majors = classNameString.split("、");

  for (const major of majors) {
    const match = major.match(/^(.+?)(\d+)-(\d+)班$/);
    if (match) {
      const [, department, start, end] = match;
      for (let i = parseInt(start); i <= parseInt(end); i++) {
        classNames.push({
          name: `${department}${i}班`,
          department,
          classNumber: i,
          grade: new Date().getFullYear(),
        });
      }
    } else {
      const basicMatch = major.match(/^(.+?)(\d+)班$/);
      if (basicMatch) {
        const [, department, classNumber] = basicMatch;
        classNames.push({
          name: major,
          department,
          classNumber: parseInt(classNumber),
          grade: new Date().getFullYear(),
        });
      }
    }
  }

  return classNames;
};

classSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    if (ret.courses) {
      ret.courses = ret.courses.map((course) =>
        typeof course === "object"
          ? { ...course, id: course._id.toString(), _id: undefined }
          : course.toString()
      );
    }

    return ret;
  },
});

module.exports = mongoose.model("Class", classSchema);
