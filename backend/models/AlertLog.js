const mongoose = require("mongoose");

const alertLogSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ["LOW_ATTENDANCE"]
  },
  percentage: {
    type: Number,
    required: true
  }
}, { timestamps: true });

alertLogSchema.index({ student: 1, date: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("AlertLog", alertLogSchema);
