const User = require("../models/User");
const Classroom = require("../models/Classroom");

exports.createFaculty = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: "Faculty already exists" });
    }

    const faculty = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: "faculty",
      department
    });

    res.status(201).json({
      _id: faculty._id,
      name: faculty.name,
      email: faculty.email,
      role: faculty.role,
      department: faculty.department
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, department, year, className } = req.body;
    if (!name || !email || !password || !department || !year || !className) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedClassName = className.trim().toUpperCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "Student already exists" });
    }

    const classroom = await Classroom.findOne({ name: normalizedClassName });
    if (!classroom) {
      return res.status(400).json({ message: `Class ${normalizedClassName} does not exist. Create it first.` });
    }

    const classCount = await User.countDocuments({
      role: "student",
      className: normalizedClassName
    });
    if (classCount >= classroom.capacity) {
      return res.status(400).json({ message: `Class ${normalizedClassName} is full (max ${classroom.capacity} students)` });
    }

    const student = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: "student",
      department,
      year,
      className: normalizedClassName
    });

    res.status(201).json({
      _id: student._id,
      name: student.name,
      email: student.email,
      department: student.department,
      year: student.year,
      className: student.className,
      role: student.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createClassroom = async (req, res) => {
  try {
    const { name, capacity } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Class name is required" });
    }

    const normalizedName = name.trim().toUpperCase();
    const finalCapacity = Number(capacity || 40);
    if (!Number.isInteger(finalCapacity) || finalCapacity < 1 || finalCapacity > 40) {
      return res.status(400).json({ message: "Class capacity must be between 1 and 40" });
    }

    const existing = await Classroom.findOne({ name: normalizedName });
    if (existing) {
      return res.status(400).json({ message: `Class ${normalizedName} already exists` });
    }

    const classroom = await Classroom.create({
      name: normalizedName,
      capacity: finalCapacity
    });

    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ name: 1 });
    const seats = await User.aggregate([
      { $match: { role: "student", className: { $exists: true, $ne: "" } } },
      { $group: { _id: "$className", count: { $sum: 1 } } }
    ]);

    const seatMap = new Map(seats.map((s) => [s._id, s.count]));
    const response = classrooms.map((classroom) => {
      const occupiedSeats = seatMap.get(classroom.name) || 0;
      return {
        _id: classroom._id,
        name: classroom.name,
        capacity: classroom.capacity,
        occupiedSeats,
        availableSeats: Math.max(classroom.capacity - occupiedSeats, 0),
        seatUsage: `${occupiedSeats}/${classroom.capacity}`
      };
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .populate("subjects", "name code");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFaculty = async (req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" }).select("-password");
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await User.findOneAndDelete({
      _id: req.params.id,
      role: "faculty"
    });

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
