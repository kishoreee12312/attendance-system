const express = require("express");
const router = express.Router();
const {
  createSubject,
  getSubjects,
  deleteSubject,
  assignFaculty,
  getFacultyClasses
} = require("../controllers/subjectController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
// Create subject (admin only)
router.post("/", protect, authorizeRoles("admin"), createSubject);

// Get all subjects
router.get("/", protect, authorizeRoles("admin", "faculty", "student"), getSubjects);
router.get("/faculty-classes", protect, authorizeRoles("faculty"), getFacultyClasses);

// Delete subject
router.delete("/:id", protect, authorizeRoles("admin"), deleteSubject);

// Assign faculty to subject
router.post("/assign-faculty", protect, authorizeRoles("admin"), assignFaculty);

module.exports = router;
