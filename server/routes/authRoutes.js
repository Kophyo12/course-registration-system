const express = require("express");
const router = express.Router();
const { login, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/login", login);
router.get("/me", requireAuth, me);

module.exports = router;