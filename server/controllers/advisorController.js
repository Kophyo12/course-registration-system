const mongoose = require("mongoose");
const Offering = require("../models/Offering");
const Course = require("../models/Course");
const User = require("../models/User");
const Record = require("../models/Record");
const Registration = require("../models/Registration");

// Shared helpers
function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function checkId(id) {
  if (
    typeof id !== "string" ||
    !mongoose.isValidObjectId(id)
  ) {
    fail(400, "Invalid ID");
  }
}

function sendError(res, error) {
  const status =
    error.status || (error.code === 11000 ? 409 : 500);

  const message = error.status
    ? error.message
    : error.code === 11000
      ? "Registration already exists"
      : "Could not complete request";

  res.status(status).json({ message });
}

// Save related changes together.
async function transaction(work) {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await work(session);
    });

    return result;
  } finally {
    await session.endSession();
  }
}

function offeringResult(offering) {
  const data = offering.toObject
    ? offering.toObject()
    : offering;

  return {
    ...data,
    seatsRemaining: Math.max(
      0,
      data.seats - data.seatsTaken
    ),
  };
}

function termFilter(query) {
  if (query.term === undefined) return {};

  if (
    typeof query.term !== "string" ||
    !query.term.trim()
  ) {
    fail(400, "Invalid term");
  }

  return { term: query.term.trim() };
}

async function findStudent(id, session = null) {
  checkId(id);

  const student = await User.findOne({
    _id: id,
    role: "student",
    active: true,
  })
    .select("name email studentId advisorId")
    .session(session);

  if (!student) fail(404, "Student not found");

  return student;
}

function positiveInteger(value, label) {
  if (
    !["string", "number"].includes(typeof value) ||
    String(value).trim() === ""
  ) {
    fail(400, `${label} must be a positive integer`);
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    fail(400, `${label} must be a positive integer`);
  }

  return number;
}

function schedule(body) {
  const result = {};

  for (const key of [
    "day",
    "startTime",
    "endTime",
    "room",
    "instructor",
  ]) {
    if (
      typeof body[key] !== "string" ||
      !body[key].trim()
    ) {
      fail(400, `${key} is required`);
    }

    result[key] = body[key].trim();
  }

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  if (!days.includes(result.day)) {
    fail(400, "Invalid day");
  }

  const pattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    !pattern.test(result.startTime) ||
    !pattern.test(result.endTime) ||
    result.startTime >= result.endTime
  ) {
    fail(
      400,
      "Use HH:mm times; end time must be after start time"
    );
  }

  result.seats = positiveInteger(body.seats, "Seats");

  return result;
}

// Offerings
async function getOfferings(req, res) {
  try {
    const offerings = await Offering.find(
      termFilter(req.query)
    )
      .populate("courseId", "code title credits")
      .sort({ term: 1, section: 1 })
      .lean();

    res.json(offerings.map(offeringResult));
  } catch (error) {
    sendError(res, error);
  }
}

async function getCourses(req, res) {
  try {
    const courses = await Course.find()
      .select("code title credits")
      .sort({ code: 1 });

    res.json(courses);
  } catch (error) {
    sendError(res, error);
  }
}

async function createOffering(req, res) {
  try {
    const body = req.body || {};

    checkId(body.courseId);

    const details = schedule(body);

    if (
      typeof body.term !== "string" ||
      !body.term.trim()
    ) {
      fail(400, "Term is required");
    }

    const section = positiveInteger(
      body.section,
      "Section"
    );

    const courseExists = await Course.exists({
      _id: body.courseId,
    });

    if (!courseExists) fail(404, "Course not found");

    const offering = await Offering.create({
      ...details,
      courseId: body.courseId,
      term: body.term.trim(),
      section,
      seatsTaken: 0,
      addDropOpen: false,
    });

    await offering.populate(
      "courseId",
      "code title credits"
    );

    res.status(201).json(offeringResult(offering));
  } catch (error) {
    sendError(res, error);
  }
}

async function updateOffering(req, res) {
  try {
    checkId(req.params.id);

    const details = schedule(req.body || {});

    // Check the latest seat count while updating.
    const offering = await Offering.findOneAndUpdate(
      {
        _id: req.params.id,
        seatsTaken: { $lte: details.seats },
      },
      { $set: details },
      { new: true, runValidators: true }
    ).populate("courseId", "code title credits");

    if (!offering) {
      const exists = await Offering.exists({
        _id: req.params.id,
      });

      if (!exists) fail(404, "Offering not found");

      fail(
        409,
        "Seats cannot be lower than seats already taken"
      );
    }

    res.json(offeringResult(offering));
  } catch (error) {
    sendError(res, error);
  }
}

async function deleteOffering(req, res) {
  try {
    checkId(req.params.id);

    await transaction(async (session) => {
      const offering = await Offering.findById(
        req.params.id
      ).session(session);

      if (!offering) fail(404, "Offering not found");

      const history = await Registration.exists({
        offeringId: req.params.id,
      }).session(session);

      if (history) {
        fail(
          409,
          "Cannot delete an offering with registration history"
        );
      }

      await Offering.deleteOne(
        { _id: req.params.id },
        { session }
      );
    });

    res.json({ message: "Offering deleted" });
  } catch (error) {
    sendError(res, error);
  }
}

// Student information
async function getStudents(req, res) {
  try {
    const students = await User.find({
      role: "student",
      active: true,
    })
      .select("name email studentId advisorId")
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    sendError(res, error);
  }
}

async function getStudentRecords(req, res) {
  try {
    const student = await findStudent(
      req.params.studentId
    );

    const records = await Record.find({
      studentId: student._id,
    })
      .populate("courseId", "code title credits")
      .sort({ term: 1 })
      .lean();

    res.json({ student, records });
  } catch (error) {
    sendError(res, error);
  }
}

async function getStudentRegistrations(req, res) {
  try {
    await findStudent(req.params.studentId);

    const registrations = await Registration.find({
      studentId: req.params.studentId,
      status: "registered",
      ...termFilter(req.query),
    })
      .populate({
        path: "offeringId",
        populate: {
          path: "courseId",
          select: "code title credits",
        },
      })
      .sort({ term: 1 })
      .lean();

    res.json(registrations);
  } catch (error) {
    sendError(res, error);
  }
}

// Basic registration — User 4 adds eligibility rules here.
async function registerStudent(req, res) {
  try {
    const { studentId, offeringId } = req.body || {};

    checkId(studentId);
    checkId(offeringId);

    const registration = await transaction(
      async (session) => {
        await findStudent(studentId, session);

        const offering = await Offering.findById(
          offeringId
        ).session(session);

        if (!offering) fail(404, "Offering not found");

        const existing = await Registration.findOne({
          studentId,
          offeringId,
        }).session(session);

        if (existing?.status === "registered") {
          fail(409, "Student is already registered");
        }

        // User 4: add academic, term, full-section and
        // time-clash checks here before either write.

        let saved;

        if (existing) {
          existing.status = "registered";
          existing.term = offering.term;
          saved = await existing.save({ session });
        } else {
          [saved] = await Registration.create(
            [{
              studentId,
              offeringId,
              term: offering.term,
              status: "registered",
            }],
            { session }
          );
        }

        const result = await Offering.updateOne(
          { _id: offeringId },
          { $inc: { seatsTaken: 1 } },
          { session }
        );

        if (result.modifiedCount !== 1) {
          fail(409, "Offering changed; please retry");
        }

        return saved;
      }
    );

    res.status(201).json(registration);
  } catch (error) {
    sendError(res, error);
  }
}

async function removeRegistration(req, res) {
  try {
    checkId(req.params.id);

    await transaction(async (session) => {
      const registration =
        await Registration.findById(
          req.params.id
        ).session(session);

      if (!registration) {
        fail(404, "Registration not found");
      }

      // Do not decrease seats twice.
      if (registration.status === "dropped") return;

      const result = await Offering.updateOne(
        {
          _id: registration.offeringId,
          seatsTaken: { $gt: 0 },
        },
        { $inc: { seatsTaken: -1 } },
        { session }
      );

      if (result.modifiedCount !== 1) {
        fail(
          409,
          "Offering missing or seat count inconsistent"
        );
      }

      registration.status = "dropped";
      await registration.save({ session });
    });

    res.json({ message: "Registration removed" });
  } catch (error) {
    sendError(res, error);
  }
}

// Open/close student Add/Drop requests for a term.
async function setAddDrop(req, res) {
  try {
    const { term, open } = req.body || {};

    if (
      typeof term !== "string" ||
      !term.trim() ||
      typeof open !== "boolean"
    ) {
      fail(
        400,
        "Term and a Boolean open value are required"
      );
    }

    const result = await Offering.updateMany(
      { term: term.trim() },
      { $set: { addDropOpen: open } },
      { runValidators: true }
    );

    if (!result.matchedCount) {
      fail(404, "No offerings found for this term");
    }

    res.json({
      message: `Add/Drop ${open ? "opened" : "closed"}`,
      term: term.trim(),
      open,
    });
  } catch (error) {
    sendError(res, error);
  }
}

module.exports = {
  getOfferings,
  getCourses,
  createOffering,
  updateOffering,
  deleteOffering,
  getStudents,
  getStudentRecords,
  getStudentRegistrations,
  registerStudent,
  removeRegistration,
  setAddDrop,
};