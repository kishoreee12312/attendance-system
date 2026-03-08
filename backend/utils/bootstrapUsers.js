const User = require("../models/User");

const ensureUser = async ({ name, email, password, role, department }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    return false;
  }

  await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
    department,
    isBlocked: false
  });

  return true;
};

const bootstrapUsers = async () => {
  const enabled = process.env.AUTO_BOOTSTRAP_USERS !== "false";
  if (!enabled) {
    return;
  }

  const adminCreated = await ensureUser({
    name: process.env.BOOTSTRAP_ADMIN_NAME || "System Admin",
    email: process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@attendance.com",
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD || "admin123",
    role: "admin",
    department: "Administration"
  });

  const facultyCreated = await ensureUser({
    name: process.env.BOOTSTRAP_FACULTY_NAME || "Faculty One",
    email: process.env.BOOTSTRAP_FACULTY_EMAIL || "faculty@attendance.com",
    password: process.env.BOOTSTRAP_FACULTY_PASSWORD || "faculty123",
    role: "faculty",
    department: "Science"
  });

  if (adminCreated || facultyCreated) {
    console.log("Bootstrap users ensured (admin/faculty)");
  }
};

module.exports = bootstrapUsers;
