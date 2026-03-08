const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function createFaculty() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const email = "faculty@attendance.com";
  const existing = await User.findOne({ email });

  if (existing) {
    existing.password = "faculty123";
    existing.role = "faculty";
    existing.department = existing.department || "Science";
    existing.isBlocked = false;
    await existing.save();

    console.log("Faculty already existed. Password reset successfully.");
    console.log("Email: faculty@attendance.com");
    console.log("Password: faculty123");
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: "Faculty One",
    email,
    password: "faculty123",
    role: "faculty",
    department: "Science"
  });

  console.log("Faculty created successfully.");
  console.log("Email: faculty@attendance.com");
  console.log("Password: faculty123");

  await mongoose.disconnect();
}

createFaculty().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
