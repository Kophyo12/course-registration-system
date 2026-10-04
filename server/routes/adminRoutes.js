const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/adminController");

// Every route below needs a logged-in admin
router.use(requireAuth, requireRole("admin"));

router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

module.exports = router;