const bcrypt = require("bcryptjs");

// Generate hashed passwords for different test users

async function generateHashedPasswords() {
  const passwords = {
    "password123": await bcrypt.hash("password123", 10),
    "admin123": await bcrypt.hash("admin123", 10),
    "faculty123": await bcrypt.hash("faculty123", 10),
    "student123": await bcrypt.hash("student123", 10)
  };

  console.log("Hashed Passwords for Testing:");
  console.log(JSON.stringify(passwords, null, 2));
}

generateHashedPasswords();
