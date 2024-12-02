const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  location: { type: String, required: true },
  resources: [String], // 例如：['projector', 'whiteboard']
});

module.exports = mongoose.model("Classroom", classroomSchema);
