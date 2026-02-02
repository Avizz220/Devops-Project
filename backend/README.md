# Backend (Node.js + Express) for Community Events Platform

This backend provides simple signup and login endpoints that store users in a MySQL database.

Endpoints
- POST /api/auth/signup
  - Body: { name, email, password, role }
  - role: "participant" or "organizer" (or "admin")
- POST /api/auth/login
  - Body: { email, password }
  - Returns: basic user info on success

Quick start
1. Copy `.env.example` to `.env` and update DB credentials.
2. Install dependencies:

   npm install

3. Start server:

   npm run dev

This server will auto-create the database and `users` table if they do not exist.

Notes
- Passwords are hashed with bcrypt.
- In production, add proper validation, rate limiting, and replace plain responses with JWTs or sessions.
