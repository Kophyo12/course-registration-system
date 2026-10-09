const PASSING_GRADES = ["A", "B+", "B", "C+", "C", "D+", "D"];

function idOf(value) {
  if (!value) return "";
  return String(value._id || value);
}

function minutes(time) {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function schedulesOverlap(first, second) {
  if (!first || !second || first.day !== second.day) return false;

  const start = minutes(first.startTime);
  const end = minutes(first.endTime);
  const otherStart = minutes(second.startTime);
  const otherEnd = minutes(second.endTime);

  return [start, end, otherStart, otherEnd].every((value) => value !== null)
    && start < otherEnd
    && end > otherStart;
}

// Both the preview and registration write use this evaluation. The caller
// loads records and populated registrations for this student only.
function evaluateEligibility(offering, { term, records = [], registrations = [] }) {
  const reasons = [];
  const courseId = idOf(offering.courseId);
  const offeringId = idOf(offering);
  const seatsRemaining = Math.max(0, Number(offering.seats) - Number(offering.seatsTaken || 0));

  if (!courseId) reasons.push("Course no longer exists");
  if (offering.term !== term) reasons.push("Offering does not belong to the selected term");

  const courseRecords = records.filter((record) => idOf(record.courseId) === courseId);
  const passed = courseRecords
    .filter((record) => PASSING_GRADES.includes(record.grade))
    .sort((first, second) => PASSING_GRADES.indexOf(first.grade) - PASSING_GRADES.indexOf(second.grade))[0];
  const retakeRequired = !passed && courseRecords.some((record) => record.grade === "F");

  if (passed) reasons.push(`Course already passed with grade ${passed.grade}`);
  if (seatsRemaining <= 0) reasons.push("Section is full; no seats remaining");

  const currentRegistrations = registrations.filter((registration) => {
    const current = registration.offeringId;
    return registration.status === "registered"
      && registration.term === term
      && (!current?.term || current.term === term);
  });

  const duplicateOffering = currentRegistrations.some((registration) => idOf(registration.offeringId) === offeringId);
  const duplicateCourse = currentRegistrations.some((registration) => courseId
    && idOf(registration.offeringId?.courseId) === courseId);

  if (duplicateOffering) {
    reasons.push("Student is already registered for this section");
  } else if (duplicateCourse) {
    reasons.push("Student is already registered for this course in the selected term");
  }

  for (const registration of currentRegistrations) {
    const current = registration.offeringId;

    // A duplicate section is already explained above.
    if (idOf(current) === offeringId || !schedulesOverlap(offering, current)) continue;

    const label = current.courseId?.code || "another registered course";
    reasons.push(`Schedule conflict with ${label}, section ${current.section} (${current.day} ${current.startTime}-${current.endTime})`);
  }

  return {
    seatsRemaining,
    eligible: reasons.length === 0,
    reasons,
    reason: reasons.join("; "),
    retakeRequired,
  };
}

function eligibleOfferingResult(offering, context) {
  const data = offering.toObject ? offering.toObject() : offering;
  return { ...data, ...evaluateEligibility(data, context) };
}

function sortEligibleOfferings(offerings) {
  return offerings.sort((first, second) => Number(second.retakeRequired) - Number(first.retakeRequired)
    || String(first.courseId?.code || "").localeCompare(String(second.courseId?.code || ""))
    || Number(first.section) - Number(second.section)
    || idOf(first).localeCompare(idOf(second)));
}

module.exports = {
  PASSING_GRADES,
  evaluateEligibility,
  eligibleOfferingResult,
  sortEligibleOfferings,
  schedulesOverlap,
};
