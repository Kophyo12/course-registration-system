const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

const User = require("../models/User");
const Course = require("../models/Course");
const Offering = require("../models/Offering");
const Registration = require("../models/Registration");
const Record = require("../models/Record");

const { advisors, students } = require("./data");

dotenv.config();

function normalizeCourseCode(code) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Registration.deleteMany();
    await Record.deleteMany();
    await Offering.deleteMany();
    await Course.deleteMany();
    await User.deleteMany();

    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Admin
    await User.create({
      name: "Test Admin",
      email: "admin@test.com",
      passwordHash,
      role: "admin",
    });

    // Advisors
    const advisorDocs = [];

    for (const advisor of advisors) {
      const advisorDoc = await User.create({
        name: advisor.name,
        email: advisor.email.toLowerCase(),
        passwordHash,
        role: "advisor",
      });

      advisorDocs.push(advisorDoc);
    }

    // Students
    const studentDocs = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      const studentDoc = await User.create({
        name: student.name,
        email: student.email.toLowerCase(),
        passwordHash,
        role: "student",
        studentId: `STU${String(i + 1).padStart(3, "0")}`,
        advisorId: advisorDocs[i % advisorDocs.length]._id,
      });

      studentDocs.push({
        user: studentDoc,
        courses: student.courses,
      });
    }

    // Unique courses
    const courseMap = new Map();

    for (const student of students) {
      for (const course of student.courses) {
        const code = normalizeCourseCode(course.code);

        if (!courseMap.has(code)) {
          courseMap.set(code, {
            code,
            title: course.title.trim(),
            credits: 3,
          });
        }
      }
    }

    const courseDocs = await Course.insertMany(
      Array.from(courseMap.values())
    );

    const courseByCode = new Map();

    for (const course of courseDocs) {
      courseByCode.set(course.code, course);
    }

    // Current offerings for IP courses
    const offeringMap = new Map();

    for (const student of students) {
      for (const course of student.courses) {
        if (course.grade !== "IP") continue;

        const code = normalizeCourseCode(course.code);

        if (offeringMap.has(code)) continue;

        const courseDoc = courseByCode.get(code);

        const offering = await Offering.create({
          courseId: courseDoc._id,
          term: course.term,
          section: 1,
          day: "Monday",
          startTime: "09:00",
          endTime: "12:00",
          room: "IT301",
          instructor: advisorDocs[0].name,
          seats: 30,
          seatsTaken: 0,
        });

        offeringMap.set(code, offering);
      }
    }

    // Records and registrations
    for (const student of studentDocs) {
      for (const course of student.courses) {
        const code = normalizeCourseCode(course.code);
        const courseDoc = courseByCode.get(code);

        if (course.grade === "IP") {
          const offering = offeringMap.get(code);

          await Registration.create({
            studentId: student.user._id,
            offeringId: offering._id,
            term: course.term,
            status: "registered",
          });

          offering.seatsTaken += 1;
          await offering.save();
        } else {
          await Record.create({
            studentId: student.user._id,
            courseId: courseDoc._id,
            term: course.term,
            grade: course.grade,
          });
        }
      }
    }

    console.log("Database seeded successfully");
    console.log(`${studentDocs.length} students created`);
    console.log(`${advisorDocs.length} advisors created`);
    console.log(`${courseDocs.length} courses created`);

    await mongoose.connection.close();
  } catch (error) {
    console.error("Seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();