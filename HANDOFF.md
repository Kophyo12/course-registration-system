# HANDOFF

Each user adds a section here when they finish, so the next user knows what exists.

## User 1 - Foundation and database
User 1 Handoff

User 1 completed the project foundation and database setup.

Completed:

MERN project structure

Express server and MongoDB connection

Core models: User, Course, Offering, Registration, Record

Seed script and dataset setup

25 students, 4 advisors, 1 admin

55 courses, offerings, records, and registrations

Password hashing with bcrypt

Environment configuration and basic API health route

The database and seed process are working and ready for the next member.

## User 2 - Authentication and Admin (done)

### Backend routes
- POST /api/auth/login - email + password, returns JWT and user
- GET /api/auth/me - returns the logged-in user (needs token)
- GET /api/admin/users?role=... - list users (admin only)
- POST /api/admin/users - create user (admin only)
- PATCH /api/admin/users/:id - edit user (admin only)
- DELETE /api/admin/users/:id - deactivates the user (admin only)

### How to protect a route (for User 3 and 4)

```js
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
router.use(requireAuth, requireRole("advisor"));
```

The logged-in user is available as `req.user` inside controllers.
Send the token as the header `Authorization: Bearer <token>`.

### Frontend
- client/src/api.js: use `apiFetch("/path")` for all server calls. It adds the token automatically.
- client/src/App.jsx: /advisor and /student currently show Placeholder pages. Replace them with the real dashboards.
- client/src/pages/Login.jsx and AdminDashboard.jsx are finished.

### Test accounts (password for all seeded accounts: Password123!)
- admin@test.com (admin)
- alex@gmail.com (student)

### Rules implemented
- Passwords are checked with bcrypt, sessions use JWT (expires in 1 day).
- Delete means deactivate (active = false). Inactive users cannot log in.
- An admin cannot deactivate themselves, and the system always keeps at least one active admin.
- Admin routes are protected on the server (403 for non-admins), not just hidden in React.
- CORS is limited to CLIENT_URL (default http://localhost:5173) in server.js.

### Setup notes for the next user
- Each person needs their own server/.env (PORT, MONGO_URI, JWT_SECRET). Never commit it.
- MongoDB Atlas must allow your IP (Network Access), or the server fails to connect.
- Known problem from the starter repo: .env and node_modules are tracked by Git.
  Add files by name (git add path/to/file), never "git add .".