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

## User 3 - Advisor, Offerings and Basic Registration

### Implemented
- Advisor dashboard replaces the `/advisor` placeholder.
- View offerings by term.
- Create, edit and delete course offerings.
- Display schedules, rooms, instructors and seat counts.
- Select active students and view academic records.
- View current registrations by selected term.
- Register students and prevent duplicate registration.
- Remove registrations and update seat counts.
- Re-register previously dropped registrations.
- Open/close Add/Drop for all offerings in a selected term.
- Edit/Delete buttons appear side by side.
- Offering deletion uses a separate confirmation dialog.

### Backend routes
All routes below require an authenticated advisor.

- GET /api/advisor/courses
- GET /api/advisor/offerings
- POST /api/advisor/offerings
- PATCH /api/advisor/offerings/:id
- DELETE /api/advisor/offerings/:id
- GET /api/advisor/students
- GET /api/advisor/students/:studentId/records
- GET /api/advisor/students/:studentId/registrations
- POST /api/advisor/registrations
- DELETE /api/advisor/registrations/:id
- PATCH /api/advisor/add-drop

Offering and student registration lists support an optional
`?term=1%2F2026` query.

### Request bodies

Register a student:
```json
{
  "studentId": "student MongoDB _id",
  "offeringId": "offering MongoDB _id"
}
```

Open/close Add/Drop:
```json
{
  "term": "1/2026",
  "open": true
}
```

Use `false` to close Add/Drop.

### Files added/updated
- server/controllers/advisorController.js
- server/routes/advisorRoutes.js
- server/server.js
- client/src/pages/AdvisorDashboard.jsx
- client/src/App.jsx

Existing models, login and Admin features were retained.
The Student dashboard remains a placeholder for User 5.

### Registration and data handling
- IDs used by these APIs are MongoDB `_id` values.
- Registration status is `registered` or `dropped`.
- Removing a registration marks it as dropped rather than deleting it.
- Re-registration reuses the existing dropped record.
- Registration and removal use transactions to update registration
  status and seat counts together.
- Repeated removal does not decrease seats twice.
- Offerings with any registration history cannot be deleted.
- Course, term and section stay fixed when editing an offering.
- Capacity cannot be reduced below seats already taken.
- `seatsRemaining` is calculated in offering responses.
- Add/Drop status uses the existing `Offering.addDropOpen` field.
- New offerings default to Add/Drop closed.
- Closing Add/Drop indicates student requests are closed; advisors
  can still manually manage registrations.

### Test account
- Email: advisor3@test.com
- Password: Password123!

These credentials apply if the seeded account has not been changed.

### Validation status
- MongoDB connection and Advisor offering display were confirmed.
- Offering editing and persistence were confirmed.
- Frontend build passed earlier during development.
- Final registration/removal, Add/Drop persistence, updated dialog,
  Admin regression and final build checks should be verified before
  the next member starts.

### Setup notes
- Keep your own server/.env; do not commit it.
- Backend currently runs on port 5001.
- Existing api.js defaults to http://localhost:5001/api.
- MongoDB transactions require Atlas or a replica set.
- No new dependencies were added.
- Do not seed the shared database during ordinary testing.