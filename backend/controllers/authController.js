const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });
};

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(value || "");

// Register User (Admin only)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, year, subjects } = req.body;

    if (!name || !email || !password || !role || !department) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role,
      department,
      year,
      subjects: Array.isArray(subjects) ? subjects : []
    });

    res.status(201).json({
      message: "User Registered Successfully",
      userId: user._id
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user)
    {
      console.warn(`Login failed: user not found for ${email}`);
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    if (user.isBlocked)
      return res.status(403).json({ message: "User Blocked" });

    let isMatch = false;
    if (isBcryptHash(user.password)) {
      isMatch = await user.matchPassword(password);
    } else {
      // Backward compatibility for legacy plaintext users; auto-migrate on login.
      isMatch = user.password === password;
      if (isMatch) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!isMatch)
    {
      console.warn(`Login failed: password mismatch for ${email}`);
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      token: generateToken(user._id, user.role)
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};
