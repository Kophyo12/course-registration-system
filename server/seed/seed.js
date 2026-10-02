const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

const User = require("../models/User");
const Course = require("../models/Course");
const Offering = require("../models/Offering");
const Registration = require("../models/Registration");
const Record = require("../models/Record");

dotenv.config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Clear old data
    await Registration.deleteMany();
    await Record.deleteMany();
    await Offering.deleteMany();
    await Course.deleteMany();
    await User.deleteMany();

    console.log("Old data cleared");

    // -------------------------
    // 1. USERS
    // -------------------------

    const passwordHash = await bcrypt.hash("Password123!", 10);

    const admin = await User.create({
      name: "Test Admin",
      email: "admin@test.com",
      passwordHash,
      role: "admin",
    });

    const advisors = await User.insertMany([
      {
        name: "Advisor One",
        email: "advisor1@test.com",
        passwordHash,
        role: "advisor",
      },
      {
        name: "Advisor Two",
        email: "advisor2@test.com",
        passwordHash,
        role: "advisor",
      },
      {
        name: "Advisor Three",
        email: "advisor3@test.com",
        passwordHash,
        role: "advisor",
      },
      {
        name: "Advisor Four",
        email: "advisor4@test.com",
        passwordHash,
        role: "advisor",
      },
    ]);

    // Students from the spreadsheet will go here later.
    const students = await User.insertMany([
      {
        name: "Student One",
        email: "student1@test.com",
        passwordHash,
        role: "student",
        studentId: "STU001",
        advisorId: advisors[0]._id,
      },
    ]);

    // -------------------------
    // 2. COURSES
    // -------------------------

    const courses = await Course.insertMany([
      {
        code: "CSC220",
        title: "Web Development II",
        credits: 3,
      },
      {
        code: "ITE120",
        title: "Web Development I",
        credits: 3,
      },
    ]);

    // -------------------------
    // 3. ACADEMIC RECORDS
    // -------------------------

    await Record.insertMany([
      {
        studentId: students[0]._id,
        courseId: courses[1]._id,
        term: "2025-3",
        grade: "B+",
      },
    ]);

    // -------------------------
    // 4. CURRENT OFFERINGS
    // -------------------------

    const offerings = await Offering.insertMany([
      {
        courseId: courses[0]._id,
        term: "2026-1",
        section: 1,
        day: "Monday",
        startTime: "09:00",
        endTime: "12:00",
        room: "IT301",
        instructor: advisors[0].name,
        seats: 30,
        seatsTaken: 0,
        addDropOpen: false,
      },
    ]);

    // -------------------------
    // 5. CURRENT REGISTRATIONS
    // -------------------------

    await Registration.create({
      studentId: students[0]._id,
      offeringId: offerings[0]._id,
      term: "2026-1",
      status: "registered",
    });

    console.log("Database seeded successfully");
    console.log(`${students.length} students created`);
    console.log(`${advisors.length} advisors created`);
    console.log("1 admin created");
    console.log(`${courses.length} courses created`);
    console.log(`${offerings.length} offerings created`);

    await mongoose.connection.close();
  } catch (error) {
    console.error("Seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();