const express = require("express");
const router = express.Router();
const {
  createFaculty,
  createStudent,
  createClassroom,
  getClassrooms,
  getStudents,
  getFaculty,
  deleteFaculty
} = require("../controllers/adminController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/create-faculty", protect, authorizeRoles("admin"), createFaculty);
router.post("/create-student", protect, authorizeRoles("admin"), createStudent);
router.post("/classes", protect, authorizeRoles("admin"), createClassroom);
router.get("/classes", protect, authorizeRoles("admin"), getClassrooms);
router.get("/students", protect, authorizeRoles("admin"), getStudents);
router.get("/faculty", protect, authorizeRoles("admin"), getFaculty);
router.delete("/faculty/:id", protect, authorizeRoles("admin"), deleteFaculty);

module.exports = router;
