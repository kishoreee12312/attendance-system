const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  capacity: {
    type: Number,
    default: 40,
    min: 1,
    max: 40
  }
}, { timestamps: true });

classroomSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Classroom", classroomSchema);
