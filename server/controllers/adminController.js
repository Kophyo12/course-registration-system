const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");

const ROLES = ["admin", "advisor", "student"];

// Safety net: would this change leave the system with no active admin?
async function isLastActiveAdmin(user) {
  if (user.role !== "admin" || !user.active) return false;
  const others = await User.countDocuments({
    role: "admin",
    active: true,
    _id: { $ne: user._id },
  });
  return others === 0;
}

function withoutHash(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  return obj;
}

// GET /api/admin/users?role=student
async function getUsers(req, res) {
  try {
    const filter = {};
    if (req.query.role) {
      if (!ROLES.includes(req.query.role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      filter.role = req.query.role;
    }
    const users = await User.find(filter).select("-passwordHash").sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

// POST /api/admin/users
async function createUser(req, res) {
  try {
    const { name, email, password, role, studentId, advisorId } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (role === "student" && !studentId) {
      return res.status(400).json({ message: "Student ID is required for students" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      studentId: studentId || null,
      advisorId: advisorId || null,
    });

    res.status(201).json(withoutHash(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
}

// PATCH /api/admin/users/:id
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, role, studentId, advisorId, active, password } = req.body || {};

    if (role !== undefined && !ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const isSelf = req.user._id.equals(user._id);
    const changesRole = role !== undefined && role !== user.role;
    const deactivates = active === false;

    if (isSelf && (changesRole || deactivates)) {
      return res.status(400).json({ message: "You cannot change your own role or deactivate yourself" });
    }

    if ((changesRole || deactivates) && (await isLastActiveAdmin(user))) {
      return res.status(400).json({ message: "The system must keep at least one active admin" });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (studentId !== undefined) user.studentId = studentId || null;
    if (advisorId !== undefined) user.advisorId = advisorId || null;
    if (active !== undefined) user.active = active;
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json(withoutHash(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
}

// DELETE /api/admin/users/:id  (deactivates, does not erase)
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user._id.equals(user._id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    if (await isLastActiveAdmin(user)) {
      return res.status(400).json({ message: "The system must keep at least one active admin" });
    }

    user.active = false;
    await user.save();
    res.json({ message: "User deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser };