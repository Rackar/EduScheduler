const mongoose = require("mongoose");

const exchangeRequestSchema = new mongoose.Schema({
  requestingTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  givingCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  receivingCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  reason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ExchangeRequest", exchangeRequestSchema);
