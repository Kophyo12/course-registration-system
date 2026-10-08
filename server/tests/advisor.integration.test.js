const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Course = require("../models/Course");
const Offering = require("../models/Offering");
const Record = require("../models/Record");
const Registration = require("../models/Registration");

// Opt in with a disposable LOCAL replica set. Never use the team's .env.
const uri = process.env.TEST_MONGO_URI;
describe("Advisor registration API with real transactions", { skip: !uri }, () => {
  let server, base, student, token, studentToken, adminToken;
  const term = "1/2026";
  const secret = "user4-local-integration-test-secret";

  before(async () => {
    assert.match(uri, /^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/user4_test_/,
      "Tests require a local database named user4_test_*.");
    process.env.JWT_SECRET = secret;
    await mongoose.connect(uri);
    for (const model of [User, Course, Offering, Record, Registration]) await model.init();
    const app = express();
    app.use(express.json());
    app.use("/api/auth", require("../routes/authRoutes"));
    app.use("/api/admin", require("../routes/adminRoutes"));
    app.use("/api/advisor", require("../routes/advisorRoutes"));
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    base = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    for (const model of [Registration, Record, Offering, Course, User]) await model.deleteMany({});
    const passwordHash = await bcrypt.hash("Password123!", 4);
    const advisor = await User.create({ name: "Test Advisor", email: "advisor@test.invalid", passwordHash, role: "advisor" });
    const admin = await User.create({ name: "Test Admin", email: "admin@test.invalid", passwordHash, role: "admin" });
    student = await User.create({ name: "Test Student", email: "student@test.invalid", passwordHash, role: "student", studentId: "TEST001", advisorId: advisor._id });
    token = jwt.sign({ id: advisor._id }, secret);
    studentToken = jwt.sign({ id: student._id }, secret);
    adminToken = jwt.sign({ id: admin._id }, secret);
  });

  async function request(path, method = "GET", body, auth = token) {
    const response = await fetch(base + path, { method,
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  }

  async function offering(code, overrides = {}) {
    let course = await Course.findOne({ code });
    if (!course) course = await Course.create({ code, title: `${code} test course`, credits: 3 });
    return Offering.create({ courseId: course._id, term, section: 1, day: "Monday",
      startTime: "09:00", endTime: "10:00", room: "A101", instructor: "Test Instructor",
      seats: 3, seatsTaken: 0, ...overrides });
  }

  const list = () => request(`/advisor/students/${student._id}/eligible-courses?term=${encodeURIComponent(term)}`);
  const register = (item, target = student, selectedTerm = term) => request("/advisor/registrations", "POST",
    { studentId: String(target._id), offeringId: String(item._id), term: selectedTerm });

  it("keeps login/admin protected and advisor endpoints advisor-only", async () => {
    const login = await request("/auth/login", "POST", { email: "advisor@test.invalid", password: "Password123!" }, null);
    assert.equal(login.status, 200);
    assert.equal(login.data.user.role, "advisor");
    const path = `/advisor/students/${student._id}/eligible-courses?term=1%2F2026`;
    assert.equal((await request(path, "GET", null, null)).status, 401);
    assert.equal((await request(path, "GET", null, "invalid")).status, 401);
    assert.equal((await request(path, "GET", null, studentToken)).status, 403);
    assert.equal((await request(path, "GET", null, adminToken)).status, 403);
    assert.equal((await request("/advisor/registrations", "POST", {}, studentToken)).status, 403);
    assert.equal((await request("/admin/users", "GET", null, adminToken)).status, 200);
    assert.equal((await request("/admin/users")).status, 403);
  });

  it("lists only selected-term offerings and validates IDs, student and term", async () => {
    const current = await offering("CSC100");
    const other = await offering("CSC200", { term: "2/2026" });
    const result = await list();
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.map(x => x._id), [String(current._id)]);
    assert.equal((await register(other)).status, 409);
    assert.equal((await request(`/advisor/students/${student._id}/eligible-courses`)).status, 400);
    assert.equal((await request("/advisor/students/bad/eligible-courses?term=1%2F2026")).status, 400);
    assert.equal((await request("/advisor/registrations", "POST", { studentId: String(student._id), offeringId: String(current._id) })).status, 400);
    await User.updateOne({ _id: student._id }, { $set: { active: false } });
    assert.equal((await list()).status, 404);
  });

  it("rejects every passing grade including D without changing registration or seats", async () => {
    for (const [index, grade] of ["A", "B+", "B", "C+", "C", "D+", "D"].entries()) {
      const item = await offering(`CSC${100 + index}`);
      await Record.create({ studentId: student._id, courseId: item.courseId, term: "2/2025", grade });
      const row = (await list()).data.find(x => x._id === String(item._id));
      assert.equal(row.eligible, false);
      assert.ok(row.reason.includes(`grade ${grade}`));
      const post = await register(item);
      assert.equal(post.status, 409);
      assert.ok(post.data.message.includes(`grade ${grade}`));
      assert.equal((await Offering.findById(item._id)).seatsTaken, 0);
    }
    assert.equal(await Registration.countDocuments(), 0);
  });

  it("prioritizes F retakes and allows W retries", async () => {
    const normal = await offering("AAA100");
    const failed = await offering("ZZZ100", { day: "Tuesday" });
    const withdrawn = await offering("CSC101", { day: "Wednesday" });
    await Record.create([
      { studentId: student._id, courseId: failed.courseId, term: "2/2025", grade: "F" },
      { studentId: student._id, courseId: withdrawn.courseId, term: "2/2025", grade: "W" },
    ]);
    const rows = (await list()).data;
    assert.equal(rows[0]._id, String(failed._id));
    assert.equal(rows[0].retakeRequired, true);
    assert.equal(rows[0].eligible, true);
    assert.equal(rows.find(x => x._id === String(withdrawn._id)).retakeRequired, false);
    assert.equal((await register(failed)).status, 201);
    assert.equal((await register(withdrawn)).status, 201);
    assert.equal((await register(normal)).status, 201);
  });

  it("any pass clears the retake flag even when history is returned out of order", async () => {
    const item = await offering("CSC100");
    await Record.create([
      { studentId: student._id, courseId: item.courseId, term: "2/2025", grade: "B" },
      { studentId: student._id, courseId: item.courseId, term: "1/2025", grade: "F" },
    ]);
    const row = (await list()).data[0];
    assert.equal(row.eligible, false);
    assert.equal(row.retakeRequired, false);
    assert.equal((await register(item)).status, 409);
  });

  it("retake flags do not bypass full seats or timetable rules", async () => {
    const registered = await offering("CSC100");
    assert.equal((await register(registered)).status, 201);
    const failed = await offering("CSC200", { seatsTaken: 3 });
    await Record.create({ studentId: student._id, courseId: failed.courseId, term: "2/2025", grade: "F" });
    const row = (await list()).data.find(x => x._id === String(failed._id));
    assert.equal(row.retakeRequired, true);
    assert.equal(row.eligible, false);
    assert.match(row.reason, /full/i);
    assert.match(row.reason, /CSC100.*section 1/i);
    assert.equal((await register(failed)).status, 409);
  });

  it("blocks same offering and same course in a different section", async () => {
    const first = await offering("CSC100");
    const second = await offering("CSC100", { section: 2, day: "Tuesday" });
    assert.equal((await register(first)).status, 201);
    assert.equal((await register(first)).status, 409);
    assert.equal((await register(second)).status, 409);
    assert.equal((await Offering.findById(first._id)).seatsTaken, 1);
    assert.equal((await Offering.findById(second._id)).seatsTaken, 0);
  });

  it("blocks overlap but permits adjacent classes and different days", async () => {
    const first = await offering("CSC100");
    assert.equal((await register(first)).status, 201);
    for (const [index, startTime, endTime] of [[1, "09:30", "10:30"], [2, "08:00", "11:00"], [3, "09:00", "10:00"]]) {
      const conflict = await offering(`CSC10${index}`, { startTime, endTime });
      const post = await register(conflict);
      assert.equal(post.status, 409);
      assert.match(post.data.message, /CSC100.*section 1/i);
    }
    assert.equal((await register(await offering("CSC200", { startTime: "10:00", endTime: "11:00" }))).status, 201);
    assert.equal((await register(await offering("CSC300", { day: "Tuesday" }))).status, 201);
  });

  it("ignores registrations from other terms and dropped sections", async () => {
    const old = await offering("CSC100", { term: "2/2025", seatsTaken: 1 });
    const dropped = await offering("CSC200");
    await Registration.create([
      { studentId: student._id, offeringId: old._id, term: old.term, status: "registered" },
      { studentId: student._id, offeringId: dropped._id, term, status: "dropped" },
    ]);
    assert.equal((await register(await offering("CSC300"))).status, 201);
  });

  it("removes once, restores eligibility, and reuses a dropped registration", async () => {
    const item = await offering("CSC100");
    const created = await register(item);
    assert.equal(created.status, 201);
    const path = `/advisor/registrations/${created.data._id}`;
    assert.equal((await request(path, "DELETE")).status, 200);
    assert.equal((await request(path, "DELETE")).status, 200);
    assert.equal((await Offering.findById(item._id)).seatsTaken, 0);
    assert.equal((await list()).data[0].eligible, true);
    const repeated = await register(item);
    assert.equal(repeated.status, 201);
    assert.equal(repeated.data._id, created.data._id);
    assert.equal(await Registration.countDocuments(), 1);
    assert.equal((await Offering.findById(item._id)).seatsTaken, 1);
  });

  it("does not overbook the last seat with simultaneous requests", async () => {
    const item = await offering("CSC100", { seats: 1 });
    const second = await User.create({ name: "Second Student", email: "second@test.invalid", passwordHash: student.passwordHash, role: "student" });
    const results = await Promise.all([register(item), register(item, second)]);
    assert.deepEqual(results.map(x => x.status).sort(), [201, 409]);
    assert.equal((await Offering.findById(item._id)).seatsTaken, 1);
    assert.equal(await Registration.countDocuments({ status: "registered" }), 1);
  });

  it("serializes concurrent overlapping registrations for one student", async () => {
    const first = await offering("CSC100");
    const second = await offering("CSC200");
    const results = await Promise.all([register(first), register(second)]);
    assert.deepEqual(results.map(x => x.status).sort(), [201, 409]);
    assert.equal(await Registration.countDocuments({ status: "registered" }), 1);
    assert.equal((await Offering.find()).reduce((sum, x) => sum + x.seatsTaken, 0), 1);
  });

  it("rejects concurrent alternate sections of one course even on different days", async () => {
    const first = await offering("CSC100");
    const second = await offering("CSC100", { section: 2, day: "Tuesday" });
    const results = await Promise.all([register(first), register(second)]);
    assert.deepEqual(results.map(x => x.status).sort(), [201, 409]);
    assert.equal(await Registration.countDocuments({ status: "registered" }), 1);
  });

  it("blocks an offering whose referenced course no longer exists", async () => {
    const item = await offering("CSC100");
    await Course.deleteOne({ _id: item.courseId });
    assert.equal((await list()).data[0].eligible, false);
    assert.equal((await register(item)).status, 409);
    assert.equal((await Offering.findById(item._id)).seatsTaken, 0);
  });

  it("preserves offering management and Add/Drop while advisors register manually", async () => {
    const item = await offering("CSC100");
    const updated = await request(`/advisor/offerings/${item._id}`, "PATCH", { day: "Tuesday", startTime: "13:00", endTime: "14:00", room: "B102", instructor: "Updated Instructor", seats: 4 });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.day, "Tuesday");
    assert.equal((await request("/advisor/add-drop", "PATCH", { term, open: true })).status, 200);
    assert.equal((await Offering.findById(item._id)).addDropOpen, true);
    assert.equal((await request("/advisor/add-drop", "PATCH", { term, open: false })).status, 200);
    assert.equal((await register(item)).status, 201);
  });
});
