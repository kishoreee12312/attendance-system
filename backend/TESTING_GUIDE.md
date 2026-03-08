package.json - Dependencies to install:

npm install express mongoose cors bcryptjs jsonwebtoken dotenv

---

ENVIRONMENT SETUP:
1. Create .env file in backend/ with MongoDB URI and JWT_SECRET
2. MongoDB must be running locally or use MongoDB Atlas URI
3. Insert first admin user manually in MongoDB

---

TESTING FLOW (using Postman/Thunder Client):

1️⃣ INSERT ADMIN (in MongoDB directly):
   {
     "name": "Admin",
     "email": "admin@gmail.com",
     "password": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DxMG3G",
     "role": "admin",
     "department": "CSE",
     "isBlocked": false,
     "createdAt": new Date(),
     "updatedAt": new Date()
   }
   
   (Password above hashes to: "password123")

2️⃣ LOGIN:
   POST http://localhost:5000/api/auth/login
   Headers: Content-Type: application/json
   Body:
   {
     "email": "admin@gmail.com",
     "password": "password123"
   }
   Response will include JWT token

3️⃣ REGISTER NEW USER (Admin only):
   POST http://localhost:5000/api/auth/register
   Headers: 
     - Content-Type: application/json
     - Authorization: Bearer {token_from_login}
   Body:
   {
     "name": "John Doe",
     "email": "john@gmail.com",
     "password": "pass123",
     "role": "student",
     "department": "CSE",
     "year": 2024
   }

---

NOTES:
- Admin role needed to register users
- Blocked users cannot login
- Passwords are hashed with bcryptjs (salt rounds: 10)
- JWT tokens expire in 1 day
