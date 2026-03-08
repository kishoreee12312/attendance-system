const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  className: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 1
  },
  status: {
    type: String,
    enum: ["Present", "Absent"],
    required: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

attendanceSchema.index({ student: 1, subject: 1, className: 1, date: 1, period: 1 }, { unique: true });
attendanceSchema.index({ className: 1, date: 1, period: 1 });
attendanceSchema.index({ markedBy: 1, date: 1, period: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
