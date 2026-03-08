const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  department: { type: String, required: false },
  classNames: [{
    type: String,
    trim: true
  }],
  faculty: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
});

subjectSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
