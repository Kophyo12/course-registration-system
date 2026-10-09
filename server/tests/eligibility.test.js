const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PASSING_GRADES,
  evaluateEligibility,
  eligibleOfferingResult,
  sortEligibleOfferings,
  schedulesOverlap,
} = require("../services/eligibility");

const term = "1/2026";

function offering(overrides = {}) {
  return {
    _id: "offering-1",
    courseId: { _id: "course-1", code: "CSC220", title: "Web Development II", credits: 3 },
    term,
    section: 1,
    day: "Monday",
    startTime: "09:00",
    endTime: "12:00",
    seats: 30,
    seatsTaken: 10,
    ...overrides,
  };
}

function record(grade, courseId = "course-1") {
  return { courseId, grade, term: "2/2025" };
}

function registration(current, overrides = {}) {
  return { offeringId: current, term, status: "registered", ...overrides };
}

test("a course with no passing history and available seats is eligible", () => {
  assert.deepEqual(evaluateEligibility(offering(), { term }), {
    seatsRemaining: 20,
    eligible: true,
    reasons: [],
    reason: "",
    retakeRequired: false,
  });
});

for (const grade of PASSING_GRADES) {
  test(`passing grade ${grade} blocks another registration and dominates F`, () => {
    const result = evaluateEligibility(offering(), {
      term,
      records: [record("F"), record("W"), record(grade)],
    });

    assert.equal(result.eligible, false);
    assert.equal(result.retakeRequired, false);
    assert.equal(result.reason, `Course already passed with grade ${grade}`);
  });
}

test("F requires a retake; W remains available without a retake flag", () => {
  const failed = evaluateEligibility(offering(), { term, records: [record("F"), record("W")] });
  assert.equal(failed.eligible, true);
  assert.equal(failed.retakeRequired, true);

  const withdrawn = evaluateEligibility(offering(), { term, records: [record("W")] });
  assert.equal(withdrawn.eligible, true);
  assert.equal(withdrawn.retakeRequired, false);
});

test("grades for other courses do not affect eligibility", () => {
  const result = evaluateEligibility(offering(), { term, records: [record("A", "course-2"), record("F", "course-3")] });
  assert.equal(result.eligible, true);
  assert.equal(result.retakeRequired, false);
});

test("full and over-capacity sections are blocked with zero remaining seats", () => {
  for (const seatsTaken of [30, 31]) {
    const result = evaluateEligibility(offering({ seatsTaken }), { term });
    assert.equal(result.seatsRemaining, 0);
    assert.equal(result.eligible, false);
    assert.match(result.reason, /Section is full/);
  }
});

test("the same section and another section of the same course are blocked", () => {
  const sameSection = evaluateEligibility(offering(), {
    term,
    registrations: [registration(offering())],
  });
  assert.deepEqual(sameSection.reasons, ["Student is already registered for this section"]);

  const otherSection = evaluateEligibility(offering(), {
    term,
    registrations: [registration(offering({ _id: "offering-2", section: 2, day: "Tuesday" }))],
  });
  assert.match(otherSection.reason, /already registered for this course/);
});

test("overlapping intervals conflict while adjacent intervals and other days do not", () => {
  const candidate = offering();
  for (const [startTime, endTime] of [["08:00", "10:00"], ["10:00", "11:00"], ["11:00", "13:00"], ["08:00", "13:00"]]) {
    assert.equal(schedulesOverlap(candidate, offering({ startTime, endTime })), true);
  }
  assert.equal(schedulesOverlap(candidate, offering({ startTime: "12:00", endTime: "13:00" })), false);
  assert.equal(schedulesOverlap(candidate, offering({ startTime: "08:00", endTime: "09:00" })), false);
  assert.equal(schedulesOverlap(candidate, offering({ day: "Tuesday" })), false);
});

test("a schedule conflict identifies the course and interval", () => {
  const current = offering({
    _id: "offering-2",
    courseId: { _id: "course-2", code: "MAT101" },
    section: 2,
    startTime: "11:00",
    endTime: "13:00",
  });
  const result = evaluateEligibility(offering(), { term, registrations: [registration(current)] });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "Schedule conflict with MAT101, section 2 (Monday 11:00-13:00)");
});

test("dropped registrations and other terms do not block a course or schedule", () => {
  const result = evaluateEligibility(offering(), {
    term,
    registrations: [
      registration(offering(), { status: "dropped" }),
      registration(offering(), { term: "2/2026" }),
      registration(offering({ term: "2/2026" })),
    ],
  });
  assert.equal(result.eligible, true);
});

test("every applicable reason is exposed and joined for registration errors", () => {
  const result = evaluateEligibility(offering({ seatsTaken: 30 }), {
    term,
    records: [record("C")],
    registrations: [registration(offering({ _id: "offering-2", courseId: { _id: "course-2", code: "MAT101" } }))],
  });
  assert.equal(result.reasons.length, 3);
  assert.equal(result.reason, result.reasons.join("; "));
  assert.equal(result.eligible, false);
});

test("a missing course or wrong selected term is blocked", () => {
  assert.match(evaluateEligibility(offering({ courseId: null }), { term }).reason, /Course no longer exists/);
  assert.match(evaluateEligibility(offering({ term: "2/2026" }), { term }).reason, /selected term/);
});

test("response preserves offering data and sorts retakes before course code and section", () => {
  const context = { term, records: [record("F", "course-3")] };
  const items = [
    offering({ _id: "a", courseId: { _id: "course-1", code: "AAA101" }, section: 2 }),
    offering({ _id: "b", courseId: { _id: "course-2", code: "AAA101" }, section: 1 }),
    offering({ _id: "c", courseId: { _id: "course-3", code: "ZZZ101" } }),
    offering({ _id: "d", courseId: { _id: "course-4", code: "BBB101" } }),
  ].map((item) => eligibleOfferingResult(item, context));

  assert.deepEqual(sortEligibleOfferings(items).map((item) => item._id), ["c", "b", "a", "d"]);
  assert.equal(items[0].courseId.code, "ZZZ101");
  assert.equal(items[0].seatsRemaining, 20);
  assert.equal(items[0].retakeRequired, true);
});
