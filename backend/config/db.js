const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: true
  });

  try {
    const indexes = await Subject.collection.indexes();
    const hasLegacySubjectCodeIndex = indexes.some((idx) => idx.name === "subjectCode_1");

    if (hasLegacySubjectCodeIndex) {
      await Subject.collection.dropIndex("subjectCode_1");
      console.log("Removed legacy MongoDB index: subjectCode_1");
    }
  } catch (error) {
    console.warn("Index migration warning:", error.message);
  }

  try {
    const attendanceIndexes = await Attendance.collection.indexes();
    const hasLegacyUnique = attendanceIndexes.some((idx) => idx.name === "student_1_subject_1_date_1");
    const hasLegacyLookup = attendanceIndexes.some((idx) => idx.name === "subject_1_date_1");
    const hasPeriodUniqueWithoutClass = attendanceIndexes.some((idx) => idx.name === "student_1_subject_1_date_1_period_1");
    const hasPeriodLookupWithoutClass = attendanceIndexes.some((idx) => idx.name === "subject_1_date_1_period_1");

    if (hasLegacyUnique) {
      await Attendance.collection.dropIndex("student_1_subject_1_date_1");
      console.log("Removed legacy MongoDB index: student_1_subject_1_date_1");
    }

    if (hasLegacyLookup) {
      await Attendance.collection.dropIndex("subject_1_date_1");
      console.log("Removed legacy MongoDB index: subject_1_date_1");
    }

    if (hasPeriodUniqueWithoutClass) {
      await Attendance.collection.dropIndex("student_1_subject_1_date_1_period_1");
      console.log("Removed legacy MongoDB index: student_1_subject_1_date_1_period_1");
    }

    if (hasPeriodLookupWithoutClass) {
      await Attendance.collection.dropIndex("subject_1_date_1_period_1");
      console.log("Removed legacy MongoDB index: subject_1_date_1_period_1");
    }
  } catch (error) {
    console.warn("Attendance index migration warning:", error.message);
  }

  console.log("MongoDB Connected");
};

module.exports = connectDB;
