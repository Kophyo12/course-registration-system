const Offering = require("../models/Offering");
const Record = require("../models/Record");
const Registration = require("../models/Registration");
const User = require("../models/User");
const { PASSING_GRADES } = require("../services/eligibility");

// Grade points used for GPA. W is not included because it does not count.
const GRADE_POINTS = {
  A: 4,
  "B+": 3.5,
  B: 3,
  "C+": 2.5,
  C: 2,
  "D+": 1.5,
  D: 1,
  F: 0,
};

// Terms are stored as "semester/year", e.g. "1/2026".
// Turn them into a number so 3/2023 comes before 1/2024.
function termOrder(term) {
  const [semester, year] = String(term).split("/").map(Number);
  return (year || 0) * 10 + (semester || 0);
}

function sendError(res, error) {
  console.error("Student API error:", error.message);
  res.status(500).json({ message: "Could not load data" });
}

// GET /api/student/registrations
// Current registered courses of the logged-in student.
async function getMyRegistrations(req, res) {
  try {
    const registrations = await Registration.find({
      studentId: req.user._id, // always the logged-in student, never from the request
      status: "registered",
    })
      .populate({
        path: "offeringId",
        populate: { path: "courseId", select: "code title credits" },
      })
      .lean();

    const courses = registrations
      .filter((registration) => registration.offeringId) // skip if the offering was removed
      .map((registration) => {
        const offering = registration.offeringId;
        return {
          registrationId: registration._id,
          term: registration.term,
          code: offering.courseId?.code || "",
          title: offering.courseId?.title || "",
          credits: offering.courseId?.credits || 0,
          section: offering.section,
          day: offering.day,
          startTime: offering.startTime,
          endTime: offering.endTime,
          room: offering.room,
          instructor: offering.instructor,
        };
      })
      .sort((a, b) => termOrder(b.term) - termOrder(a.term) || a.code.localeCompare(b.code));

    res.json(courses);
  } catch (error) {
    sendError(res, error);
  }
}

// GET /api/student/records
// Previous academic records grouped by term, plus GPA and credits.
async function getMyRecords(req, res) {
  try {
    const records = await Record.find({ studentId: req.user._id })
      .populate("courseId", "code title credits")
      .lean();

    // Courses the student has passed at least once.
    const passedCourses = new Set(
      records
        .filter((record) => PASSING_GRADES.includes(record.grade))
        .map((record) => String(record.courseId?._id))
    );

    let gradePoints = 0;
    let gpaCredits = 0;
    let creditsEarned = 0;
    const countedPassed = new Set();
    const groups = {};

    for (const record of records) {
      const courseId = String(record.courseId?._id);
      const credits = record.courseId?.credits || 0;

      // GPA: every graded attempt counts, W does not.
      if (record.grade in GRADE_POINTS) {
        gradePoints += GRADE_POINTS[record.grade] * credits;
        gpaCredits += credits;
      }

      // Credits earned: each passed course is counted once.
      if (PASSING_GRADES.includes(record.grade) && !countedPassed.has(courseId)) {
        creditsEarned += credits;
        countedPassed.add(courseId);
      }

      if (!groups[record.term]) groups[record.term] = [];
      groups[record.term].push({
        code: record.courseId?.code || "",
        title: record.courseId?.title || "",
        credits,
        grade: record.grade,
        // F needs a retake unless the course was passed in another term.
        retakeRequired: record.grade === "F" && !passedCourses.has(courseId),
      });
    }

    // Newest term first; courses sorted by code inside each term.
    const terms = Object.keys(groups)
      .sort((a, b) => termOrder(b) - termOrder(a))
      .map((term) => ({
        term,
        records: groups[term].sort((a, b) => a.code.localeCompare(b.code)),
      }));

    res.json({
      terms,
      summary: {
        gpa: gpaCredits ? Number((gradePoints / gpaCredits).toFixed(2)) : null,
        gpaCredits,
        creditsEarned,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
}

// GET /api/student/add-drop
// Add/Drop status for the current term and how to request a change.
async function getAddDropInfo(req, res) {
  try {
    // The current term is the latest term that has offerings.
    const terms = await Offering.distinct("term");
    const term = terms.sort((a, b) => termOrder(b) - termOrder(a))[0] || null;

    // Advisors open/close Add/Drop for all offerings of a term together.
    const openOffering = term
      ? await Offering.findOne({ term, addDropOpen: true }).select("addDropDeadline").lean()
      : null;

    const advisor = req.user.advisorId
      ? await User.findById(req.user.advisorId).select("name email active").lean()
      : null;

    res.json({
      term,
      open: Boolean(openOffering),
      deadline: openOffering?.addDropDeadline || null,
      advisor: advisor ? { name: advisor.name, email: advisor.email, active: advisor.active } : null,
      emailSubject: `Add/Drop Request - ${req.user.studentId || "ID"} - ${req.user.name} - ${term || ""}`,
      formUrl: "/add-drop-form.pdf",
    });
  } catch (error) {
    sendError(res, error);
  }
}

module.exports = {
  getMyRegistrations,
  getMyRecords,
  getAddDropInfo,
};
