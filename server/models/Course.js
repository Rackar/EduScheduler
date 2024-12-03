const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  credit: { type: Number, required: true },
  hours: { type: Number, required: true },
  type: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["available", "assigned", "pending_exchange"],
    default: "available",
  },
  semester: {
    type: String,
    default: () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      return `${year}${month <= 7 ? "春季" : "秋季"}`;
    },
  },
});

module.exports = mongoose.model("Course", courseSchema);
