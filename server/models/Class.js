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

classSchema.statics.parseClassNames = function (
  classNameString,
  studentCount = 0
) {
  if (!classNameString) return [];

  const classNames = [];
  const majors = classNameString.split("、");

  for (const major of majors) {
    let department, gradeStr, classNumberStr;

    let rangeMatch = major.match(/^(.+?)(\d{2})级(\d+)-(\d+)班$/);
    if (rangeMatch) {
      const [, dept, grade, start, end] = rangeMatch;
      department = dept;
      const gradeYear = 2000 + parseInt(grade);
      const startNum = parseInt(start);
      const endNum = parseInt(end);

      const avgStudentCount = Math.floor(
        studentCount / (endNum - startNum + 1)
      );

      for (let i = startNum; i <= endNum; i++) {
        classNames.push({
          name: `${department}${grade}级${i}班`,
          department,
          grade: gradeYear,
          classNumber: i,
          studentCount: avgStudentCount,
        });
      }
    } else {
      let basicMatch = major.match(/^(.+?)(\d{2})级(\d+)班$/);
      if (basicMatch) {
        const [, dept, grade, classNum] = basicMatch;
        department = dept;
        const gradeYear = 2000 + parseInt(grade);
        const classNumber = parseInt(classNum);

        classNames.push({
          name: major,
          department,
          grade: gradeYear,
          classNumber,
          studentCount: parseInt(studentCount) || 0,
        });
      } else {
        basicMatch = major.match(/^(.+?)(\d+)班$/);
        if (basicMatch) {
          const [, dept, classNum] = basicMatch;
          department = dept;
          const classNumber = parseInt(classNum);

          classNames.push({
            name: major,
            department,
            grade: new Date().getFullYear(),
            classNumber,
            studentCount: parseInt(studentCount) || 0,
          });
        }
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
