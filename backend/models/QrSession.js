const mongoose = require("mongoose");

const qrSessionSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  className: {
    type: String,
    trim: true
  },
  period: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

qrSessionSchema.index({ token: 1 }, { unique: true });
qrSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("QrSession", qrSessionSchema);
