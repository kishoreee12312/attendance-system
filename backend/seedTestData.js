const mongoose = require("mongoose");
const User = require("./models/User");
const Subject = require("./models/Subject");

async function seed() {
  await mongoose.connect("mongodb://localhost:27017/attendance-system");

  await User.deleteMany({});
  await Subject.deleteMany({});

  const subject1 = await Subject.create({ name: "Mathematics", code: "MATH101" });
  const subject2 = await Subject.create({ name: "Physics", code: "PHY101" });

  const users = [
    {
      name: "System Admin",
      email: "admin@attendance.com",
      password: "admin123",
      department: "Administration",
      role: "admin"
    },
    {
      name: "Faculty One",
      email: "faculty@attendance.com",
      password: "faculty123",
      department: "Science",
      role: "faculty"
    },
    { name: "Alice", email: "alice1@example.com", password: "pass123", department: "Science", year: 1, role: "student", subjects: [subject1._id, subject2._id] },
    { name: "Bob", email: "bob2@example.com", password: "pass123", department: "Science", year: 1, role: "student", subjects: [subject1._id, subject2._id] },
    { name: "Charlie", email: "charlie3@example.com", password: "pass123", department: "Science", year: 2, role: "student", subjects: [subject1._id, subject2._id] },
    { name: "David", email: "david4@example.com", password: "pass123", department: "Science", year: 2, role: "student", subjects: [subject1._id, subject2._id] },
    { name: "Eve", email: "eve5@example.com", password: "pass123", department: "Science", year: 3, role: "student", subjects: [subject1._id, subject2._id] }
  ];

  for (const userData of users) {
    await User.create(userData);
  }

  console.log("Seeded admin, faculty, students, and subjects.");
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
