const express = require("express");
const router = express.Router();

const {
  createStudent,
  getStudents,
  deleteStudent
} = require("../controllers/studentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Create student (faculty only)
router.post("/create", protect, authorizeRoles("faculty"), createStudent);
router.get("/", protect, authorizeRoles("admin", "faculty"), getStudents);
router.delete("/:id", protect, authorizeRoles("admin", "faculty"), deleteStudent);

module.exports = router;
