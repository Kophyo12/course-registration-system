const express = require("express");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const student = require("../controllers/studentController");

const router = express.Router();

// Every route below needs a logged-in student.
// Data always belongs to req.user, so a student can only see their own.
router.use(requireAuth, requireRole("student"));

router.get("/registrations", student.getMyRegistrations);
router.get("/records", student.getMyRecords);
router.get("/add-drop", student.getAddDropInfo);

module.exports = router;
