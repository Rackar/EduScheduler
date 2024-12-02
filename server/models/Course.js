const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  hours: { type: Number, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["available", "assigned", "pending_exchange"],
    default: "available",
  },
  semester: { type: String, required: true },
});

module.exports = mongoose.model("Course", courseSchema);
