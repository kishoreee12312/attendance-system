const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const QrSession = require("../models/QrSession");
const Subject = require("../models/Subject");
const Classroom = require("../models/Classroom");
const AlertLog = require("../models/AlertLog");
const { sendLowAttendanceEmail, isAlertsEnabled } = require("../utils/mailer");

const normalizeToDayStart = (inputDate = new Date()) => {
  const date = new Date(inputDate);
  date.setHours(0, 0, 0, 0);
  return date;
};

const sendLowAttendanceAlertsForStudents = async (studentIds) => {
  if (!isAlertsEnabled || !Array.isArray(studentIds) || studentIds.length === 0) {
    return;
  }

  const uniqueStudentIds = [...new Set(studentIds.map((id) => String(id)))];
  const today = normalizeToDayStart(new Date());

  for (const studentId of uniqueStudentIds) {
    const student = await User.findOne({ _id: studentId, role: "student" }).select("name email");
    if (!student || !student.email) {
      continue;
    }

    const records = await Attendance.find({ student: student._id }).select("status");
    const total = records.length;
    const present = records.filter((record) => record.status === "Present").length;
    const percentage = total === 0 ? 0 : Number(((present / total) * 100).toFixed(2));

    if (percentage >= 75) {
      continue;
    }

    const alreadySent = await AlertLog.findOne({
      student: student._id,
      date: today,
      type: "LOW_ATTENDANCE"
    });
    if (alreadySent) {
      continue;
    }

    try {
      await sendLowAttendanceEmail(student.email, student.name, percentage);
      await AlertLog.create({
        student: student._id,
        date: today,
        type: "LOW_ATTENDANCE",
        percentage
      });
    } catch (error) {
      // Do not fail attendance flow when email provider fails.
    }
  }
};

// Mark Attendance (Faculty)
exports.markAttendance = async (req, res) => {
  try {
    const { subjectId, date, records, period, className } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "records are required" });
    }
    if (!className) {
      return res.status(400).json({ message: "className is required" });
    }
    const normalizedClassName = className.trim().toUpperCase();

    const periodNumber = Number(period ?? 1);
    if (!Number.isInteger(periodNumber) || periodNumber < 1 || periodNumber > 5) {
      return res.status(400).json({ message: "Period must be between 1 and 5" });
    }

    const attendanceDate = normalizeToDayStart(date || new Date());

    const facultyPeriodConflict = await Attendance.findOne({
      markedBy: req.user.id,
      date: attendanceDate,
      period: periodNumber,
      className: { $ne: normalizedClassName }
    });
    if (facultyPeriodConflict) {
      return res.status(400).json({
        message: `You already marked attendance for ${facultyPeriodConflict.className} in period ${periodNumber} today`
      });
    }

    let effectiveSubjectId = subjectId;
    if (!effectiveSubjectId) {
      const matchingSubjects = await Subject.find({
        faculty: req.user.id,
        classNames: normalizedClassName
      }).select("_id");

      if (matchingSubjects.length === 0) {
        return res.status(400).json({ message: `No subject assigned to you for class ${normalizedClassName}` });
      }
      if (matchingSubjects.length > 1) {
        return res.status(400).json({ message: `Multiple subjects are assigned for class ${normalizedClassName}. Contact admin.` });
      }
      effectiveSubjectId = matchingSubjects[0]._id;
    }

    const existing = await Attendance.findOne({
      className: normalizedClassName,
      date: attendanceDate,
      period: periodNumber
    });

    if (existing) {
      return res.status(400).json({
        message: `Attendance already marked for class ${normalizedClassName}, period ${periodNumber} on this date`
      });
    }

    const attendanceRows = records.map((record) => ({
      student: record.studentId,
      subject: effectiveSubjectId,
      className: normalizedClassName,
      date: attendanceDate,
      period: periodNumber,
      status: record.status,
      markedBy: req.user.id
    }));

    await Attendance.insertMany(attendanceRows, { ordered: false });
    await sendLowAttendanceAlertsForStudents(attendanceRows.map((row) => row.student));

    res.json({
      message: "Attendance Marked Successfully",
      count: attendanceRows.length,
      period: periodNumber,
      className: normalizedClassName
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ message: "Duplicate attendance record detected" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get Student Attendance Percentage
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const attendanceRecords = await Attendance.find({ student: studentId });

    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (rec) => rec.status === "Present"
    ).length;

    const percentage = totalClasses === 0
      ? 0
      : Number(((presentCount / totalClasses) * 100).toFixed(2));

    res.json({
      totalClasses,
      presentCount,
      percentage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Subject-wise Attendance for Student
exports.getSubjectWiseAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const records = await Attendance.find({ student: studentId })
      .populate("subject", "name code");

    const result = {};

    records.forEach((rec) => {
      if (!rec.subject) {
        return;
      }

      const subjectKey = rec.subject.code || rec.subject.name;

      if (!result[subjectKey]) {
        result[subjectKey] = {
          subject: rec.subject.name,
          code: rec.subject.code,
          total: 0,
          present: 0
        };
      }

      result[subjectKey].total += 1;
      if (rec.status === "Present") {
        result[subjectKey].present += 1;
      }
    });

    const finalData = Object.values(result).map((item) => ({
      subject: item.subject,
      code: item.code,
      percentage: Number(((item.present / item.total) * 100).toFixed(2))
    }));

    res.json(finalData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin analytics: overall present/absent percentages
exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalRecords = await Attendance.countDocuments();
    const presentRecords = await Attendance.countDocuments({ status: "Present" });
    const absentRecords = await Attendance.countDocuments({ status: "Absent" });

    const presentPercentage = totalRecords === 0
      ? 0
      : Number(((presentRecords / totalRecords) * 100).toFixed(2));

    const absentPercentage = totalRecords === 0
      ? 0
      : Number(((absentRecords / totalRecords) * 100).toFixed(2));

    res.json({
      totalRecords,
      presentPercentage,
      absentPercentage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get students with attendance < 75%
exports.getLowAttendanceStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("name email");

    const lowAttendanceList = [];

    for (const student of students) {
      const records = await Attendance.find({ student: student._id });

      const total = records.length;
      const present = records.filter((r) => r.status === "Present").length;

      const percentage = total === 0 ? 0 : (present / total) * 100;

      if (percentage < 75) {
        const roundedPercentage = Number(percentage.toFixed(2));
        lowAttendanceList.push({
          name: student.name,
          email: student.email,
          percentage: roundedPercentage
        });

      }
    }

    res.json(lowAttendanceList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Class management data for admin/faculty
exports.getClassManagementData = async (req, res) => {
  try {
    const role = req.user.role;
    const facultyId = req.user.id;
    let allowedClasses = [];
    let classroomDocs = [];

    if (role === "admin") {
      classroomDocs = await Classroom.find().sort({ name: 1 }).select("name capacity");
      allowedClasses = classroomDocs.map((cls) => cls.name);
    } else {
      const subjects = await Subject.find({ faculty: facultyId }).select("classNames");
      const classSet = new Set();
      subjects.forEach((subject) => {
        (subject.classNames || []).forEach((name) => classSet.add((name || "").trim().toUpperCase()));
      });
      allowedClasses = Array.from(classSet).filter(Boolean).sort();
      classroomDocs = await Classroom.find({ name: { $in: allowedClasses } }).select("name capacity");
    }

    if (allowedClasses.length === 0) {
      return res.json({
        classes: [],
        selectedClass: null,
        classSummary: null,
        students: []
      });
    }

    const requestedClass = (req.query.className || "").trim().toUpperCase();
    const selectedClass = allowedClasses.includes(requestedClass) ? requestedClass : allowedClasses[0];

    const classMeta = classroomDocs.find((c) => c.name === selectedClass);
    const capacity = classMeta?.capacity || 40;

    const students = await User.find({ role: "student", className: selectedClass })
      .select("name email department year className")
      .sort({ name: 1 });

    const attendanceClassRecords = await Attendance.find({ className: selectedClass }).select("student status");
    const totalRecords = attendanceClassRecords.length;
    const presentRecords = attendanceClassRecords.filter((record) => record.status === "Present").length;
    const absentRecords = totalRecords - presentRecords;
    const classAttendancePercentage = totalRecords === 0
      ? 0
      : Number(((presentRecords / totalRecords) * 100).toFixed(2));

    const perStudentMap = new Map();
    attendanceClassRecords.forEach((record) => {
      const key = String(record.student);
      const current = perStudentMap.get(key) || { total: 0, present: 0 };
      current.total += 1;
      if (record.status === "Present") {
        current.present += 1;
      }
      perStudentMap.set(key, current);
    });

    const studentRows = students.map((student) => {
      const stats = perStudentMap.get(String(student._id)) || { total: 0, present: 0 };
      const attendancePercentage = stats.total === 0
        ? 0
        : Number(((stats.present / stats.total) * 100).toFixed(2));
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        className: student.className,
        presentCount: stats.present,
        totalClasses: stats.total,
        attendancePercentage
      };
    });

    const occupiedSeats = students.length;
    const availableSeats = Math.max(capacity - occupiedSeats, 0);

    res.json({
      classes: allowedClasses,
      selectedClass,
      classSummary: {
        className: selectedClass,
        capacity,
        occupiedSeats,
        availableSeats,
        seatUsage: `${occupiedSeats}/${capacity}`,
        totalRecords,
        presentRecords,
        absentRecords,
        classAttendancePercentage
      },
      students: studentRows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate QR for Attendance (Faculty)
exports.generateQR = async (req, res) => {
  try {
    const { subjectId, className, period } = req.body;
    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required" });
    }

    const periodNumber = Number(period ?? 1);
    if (!Number.isInteger(periodNumber) || periodNumber < 1 || periodNumber > 5) {
      return res.status(400).json({ message: "Period must be between 1 and 5" });
    }

    const normalizedClassName = className ? className.trim().toUpperCase() : null;
    const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id }).select("classNames");
    if (!subject) {
      return res.status(403).json({ message: "You are not allowed to generate QR for this subject" });
    }

    if (normalizedClassName && !(subject.classNames || []).includes(normalizedClassName)) {
      return res.status(400).json({ message: `Subject is not assigned for class ${normalizedClassName}` });
    }

    const effectiveClassName = normalizedClassName || (subject.classNames || [])[0] || undefined;
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await QrSession.create({
      subject: subjectId,
      generatedBy: req.user.id,
      className: effectiveClassName,
      period: periodNumber,
      token,
      expiresAt
    });

    const qrData = JSON.stringify({
      token,
      className: effectiveClassName,
      period: periodNumber
    });
    const qrImage = await QRCode.toDataURL(qrData);

    res.json({
      qrImage,
      expiresAt,
      className: effectiveClassName,
      period: periodNumber
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student Scan QR for Attendance
exports.scanQR = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "QR token is required" });
    }

    if (!req.user || req.user.role !== "student") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const session = await QrSession.findOne({ token });

    if (!session || session.expiresAt < new Date()) {
      return res.status(400).json({ message: "QR Expired" });
    }

    const today = normalizeToDayStart(new Date());
    const qrPeriod = Number(session.period ?? 1);
    const subject = await Subject.findById(session.subject).select("classNames");
    const classForQr = (session.className || subject?.classNames?.[0] || "GENERAL").toUpperCase();
    const student = await User.findById(req.user.id).select("className");
    const studentClassName = (student?.className || "").trim().toUpperCase();
    if (classForQr !== "GENERAL" && studentClassName && studentClassName !== classForQr) {
      return res.status(403).json({ message: `This QR is for class ${classForQr}. Your class is ${studentClassName}.` });
    }

    const alreadyMarked = await Attendance.findOne({
      student: req.user.id,
      subject: session.subject,
      date: today,
      period: qrPeriod,
      className: classForQr
    });
    if (alreadyMarked) {
      return res.status(400).json({ message: "Attendance already marked for today" });
    }

    await Attendance.create({
      student: req.user.id,
      subject: session.subject,
      className: classForQr,
      date: today,
      period: qrPeriod,
      status: "Present",
      markedBy: session.generatedBy || req.user.id
    });
    await sendLowAttendanceAlertsForStudents([req.user.id]);

    res.json({ message: "Attendance Marked via QR" });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ message: "Attendance already marked for today" });
    }
    res.status(500).json({ message: error.message });
  }
};
