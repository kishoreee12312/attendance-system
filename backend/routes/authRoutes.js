const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Admin only can register users
router.post("/register", protect, authorizeRoles("admin"), registerUser);

// Login
router.post("/login", loginUser);

module.exports = router;
