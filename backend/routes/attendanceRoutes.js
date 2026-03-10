const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getStudentAttendance,
  getSubjectWiseAttendance,
  getAdminAnalytics,
  getLowAttendanceStudents,
  getClassManagementData,
  getFacultyReportAnalytics,
  generateQR,
  scanQR
} = require("../controllers/attendanceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Faculty marks attendance
router.post("/", protect, authorizeRoles("faculty"), markAttendance);
router.post("/mark", protect, authorizeRoles("faculty"), markAttendance);

// Student views their attendance
router.get("/", protect, authorizeRoles("student"), getStudentAttendance);

// Student subject-wise attendance
router.get("/subjectwise", protect, authorizeRoles("student"), getSubjectWiseAttendance);

// Admin analytics
router.get("/admin-analytics", protect, authorizeRoles("admin"), getAdminAnalytics);

// Admin: low attendance students
router.get("/low-attendance", protect, authorizeRoles("admin"), getLowAttendanceStudents);
router.get("/class-management", protect, authorizeRoles("admin", "faculty"), getClassManagementData);
router.get("/faculty-report", protect, authorizeRoles("faculty"), getFacultyReportAnalytics);

// Faculty generate QR for attendance
router.post("/generate-qr", protect, authorizeRoles("faculty"), generateQR);

// Student scan QR for attendance
router.post("/scan-qr", protect, authorizeRoles("student"), scanQR);

module.exports = router;
