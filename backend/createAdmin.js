const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function createAdmin() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@attendance.com";
  const existing = await User.findOne({ email });

  if (existing) {
    existing.password = "admin123";
    existing.role = "admin";
    existing.department = existing.department || "Administration";
    existing.isBlocked = false;
    await existing.save();

    console.log("Admin already existed. Password reset successfully.");
    console.log("Email: admin@attendance.com");
    console.log("Password: admin123");
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: "System Admin",
    email,
    password: "admin123",
    role: "admin",
    department: "Administration"
  });

  console.log("Admin created successfully.");
  console.log("Email: admin@attendance.com");
  console.log("Password: admin123");

  await mongoose.disconnect();
}

createAdmin().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
