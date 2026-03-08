const User = require("../models/User");

exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, department, year, subject, subjects } = req.body;

    if (!name || !email || !password || !department || !year) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Student already exists" });
    }

    const normalizedSubjects = Array.isArray(subjects)
      ? subjects
      : (subject ? [subject] : []);

    const student = new User({
      name,
      email: normalizedEmail,
      password,
      department,
      year,
      subjects: normalizedSubjects,
      role: "student"
    });

    await student.save();

    res.status(201).json({
      _id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
      department: student.department,
      year: student.year,
      subjects: student.subjects
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudents = async (req, res) => {
  const students = await User.find({ role: "student" })
    .select("-password")
    .populate("subjects", "name code");
  res.json(students);
};

exports.deleteStudent = async (req, res) => {
  const student = await User.findOneAndDelete({
    _id: req.params.id,
    role: "student"
  });

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  res.json({ message: "Student deleted" });
};
