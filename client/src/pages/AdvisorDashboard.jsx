import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, clearSession, getUser } from "../api";

const emptyForm = {
  courseId: "",
  term: "1/2026",
  section: "1",
  day: "Monday",
  startTime: "",
  endTime: "",
  room: "",
  instructor: "",
  seats: "30",
};

const fields = [
  ["term", "Term", "text"],
  ["section", "Section", "number"],
  ["startTime", "Start time", "time"],
  ["endTime", "End time", "time"],
  ["room", "Room", "text"],
  ["instructor", "Instructor", "text"],
  ["seats", "Seats", "number"],
];

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];


function courseName(course) {
  return course
    ? `${course.code} — ${course.title}`
    : "Course unavailable";
}

function Table({ headers, children }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function DeleteDialog({
  offering,
  busy,
  error,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="delete-dialog"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="delete-title">
        Delete Offering?
      </h2>

      <p id="delete-description">
        Are you sure you want to delete{" "}
        <strong>{courseName(offering.courseId)}</strong>?
      </p>

      <p>
        Section {offering.section} · Term {offering.term}
      </p>

      <p className="muted">
        This cannot be undone. Offerings with registration
        history cannot be deleted.
      </p>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="dialog-actions">
        <button
          type="button"
          className="secondary-button"
          autoFocus
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="button"
          className="danger-button"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Deleting..." : "Confirm Delete"}
        </button>
      </div>
    </dialog>
  );
}

export default function AdvisorDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [offerings, setOfferings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });

  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [term, setTerm] = useState("1/2026");

  const [studentId, setStudentId] = useState("");
  const [offeringId, setOfferingId] = useState("");
  const [dropId, setDropId] = useState(null);
  const [studentError, setStudentError] = useState("");
  const [studentLoading, setStudentLoading] = useState(false);
  const [revision, setRevision] = useState(0);

  const [studentData, setStudentData] = useState({
    key: "",
    records: [],
    registrations: [],
    eligibility: [],
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [offeringData, courseData, studentList] =
          await Promise.all([
            apiFetch("/advisor/offerings"),
            apiFetch("/advisor/courses"),
            apiFetch("/advisor/students"),
          ]);

        if (active) {
          setOfferings(offeringData);
          setCourses(courseData);
          setStudents(studentList);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setStudentError("");
    setStudentLoading(Boolean(studentId));
    setDropId(null);
    setOfferingId("");

    if (studentId) {
      Promise.all([
        apiFetch(`/advisor/students/${studentId}/records`),

        apiFetch(
          `/advisor/students/${studentId}/registrations?term=${encodeURIComponent(
            term
          )}`
        ),

        apiFetch(
          `/advisor/students/${studentId}/eligible-courses?term=${encodeURIComponent(
            term
          )}`
        ),
      ])
        .then(([history, registrations, eligibility]) => {
          if (active) {
            setStudentData({
              key: `${studentId}:${term}:${revision}`,
              records: history.records,
              registrations,
              eligibility,
            });
          }
        })
        .catch((err) => {
          if (active) setStudentError(err.message);
        })
        .finally(() => {
          if (active) setStudentLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [studentId, term, revision]);

  const visible = offerings.filter(
    (offering) => offering.term === term
  );

  const dataReady =
    studentData.key === `${studentId}:${term}:${revision}` &&
    !studentLoading &&
    !studentError;

  const registrations = dataReady
    ? studentData.registrations
    : [];

  const records = dataReady
    ? studentData.records
    : [];

  const eligibility = dataReady
    ? studentData.eligibility
    : [];

  const selectedOffering = eligibility.find(
    (offering) => offering._id === offeringId
  );

  const canRegister =
    dataReady &&
    selectedOffering?.eligible === true &&
    !busy &&
    !loading &&
    !studentLoading;

  const terms = [
    ...new Set([
      "1/2026",
      ...offerings.map((offering) => offering.term),
    ]),
  ];

  const addDropStatus = !visible.length
    ? "No offerings"
    : visible.every((offering) => offering.addDropOpen)
      ? "Open"
      : visible.every((offering) => !offering.addDropOpen)
        ? "Closed"
        : "Mixed";

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, term });
  }

  function changeField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function editOffering(offering) {
    setEditingId(offering._id);
    setError("");
    setMessage("");

    setForm({
      courseId: offering.courseId?._id || "",
      term: offering.term,
      section: String(offering.section),
      day: offering.day,
      startTime: offering.startTime,
      endTime: offering.endTime,
      room: offering.room,
      instructor: offering.instructor,
      seats: String(offering.seats),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelDelete() {
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function mutate(
    path,
    method,
    body,
    success,
    after,
    deletion = false
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    setDeleteError("");

    try {
      await apiFetch(path, {
        method,
        ...(body
          ? { body: JSON.stringify(body) }
          : {}),
      });

      after?.();

      setMessage(success);

      setRevision((value) => value + 1);

      try {
        setOfferings(
          await apiFetch("/advisor/offerings")
        );
      } catch {
        setError(
          "Change saved, but refresh failed. Reload the page before continuing."
        );
      }
    } catch (err) {
      if (deletion) {
        setDeleteError(err.message);
      } else {
        setError(err.message);
      }

      if (
        path === "/advisor/registrations" &&
        method === "POST"
      ) {
        setRevision((value) => value + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  function saveOffering(event) {
    event.preventDefault();

    const body = editingId
      ? {
          day: form.day,
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room,
          instructor: form.instructor,
          seats: form.seats,
        }
      : form;

    mutate(
      editingId
        ? `/advisor/offerings/${editingId}`
        : "/advisor/offerings",
      editingId ? "PATCH" : "POST",
      body,
      editingId
        ? "Offering updated"
        : "Offering created",
      resetForm
    );
  }

  function confirmDelete() {
    const id = deleteTarget._id;

    mutate(
      `/advisor/offerings/${id}`,
      "DELETE",
      null,
      "Offering deleted",
      () => {
        if (editingId === id) {
          resetForm();
        }

        cancelDelete();
      },
      true
    );
  }

  function handleLogout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="dashboard-page">
      {deleteTarget && (
        <DeleteDialog
          offering={deleteTarget}
          busy={busy}
          error={deleteError}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      <div className="dashboard-header">
        <div>
          <h1>Advisor Dashboard</h1>

          <p>
            Logged in as{" "}
            <strong>{user?.name}</strong>
            {user?.role ? ` · ${user.role}` : ""}
          </p>
        </div>

        <button
          className="secondary-button"
          disabled={busy}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}

      {loading && (
        <div className="panel">
          <p>Loading dashboard...</p>
        </div>
      )}

      <div className="panel advisor-section">
        <div className="section-heading">
          <div>
            <h2>
              {editingId
                ? "Edit Offering"
                : "Create Offering"}
            </h2>

            <p>
              {editingId
                ? "Update the schedule and section details."
                : "Create a course section for students to register."}
            </p>
          </div>
        </div>

        {editingId && (
          <div className="info-box">
            Course, term and section stay fixed while
            editing.
          </div>
        )}

        <form onSubmit={saveOffering}>
          <fieldset
            className="offering-form-grid"
            disabled={busy || loading}
          >
            <legend>Section details</legend>

            <div className="form-group">
              <label>Course</label>

              <select
                name="courseId"
                value={form.courseId}
                onChange={changeField}
                disabled={Boolean(editingId)}
                required
              >
                <option value="">
                  Select a course
                </option>

                {courses.map((course) => (
                  <option
                    key={course._id}
                    value={course._id}
                  >
                    {courseName(course)}
                  </option>
                ))}
              </select>
            </div>

            {fields.map(([name, label, type]) => (
              <div
                className="form-group"
                key={name}
              >
                <label>{label}</label>

                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={changeField}
                  min={
                    type === "number"
                      ? 1
                      : undefined
                  }
                  step={
                    type === "number"
                      ? 1
                      : undefined
                  }
                  disabled={
                    Boolean(editingId) &&
                    ["term", "section"].includes(
                      name
                    )
                  }
                  required
                />
              </div>
            ))}

            <div className="form-group">
              <label>Day</label>

              <select
                name="day"
                value={form.day}
                onChange={changeField}
              >
                {days.map((day) => (
                  <option key={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions full-width">
              <button
                disabled={
                  !editingId &&
                  !courses.length
                }
              >
                {busy
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Offering"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </div>

      <div className="panel advisor-section">
        <div className="section-heading">
          <div>
            <h2>
              Offerings & Add / Drop
            </h2>

            <p>
              Manage course sections and registration
              availability.
            </p>
          </div>

          <span
            className={
              addDropStatus === "Open"
                ? "status-badge active"
                : addDropStatus === "Closed"
                  ? "status-badge inactive"
                  : "status-badge warning"
            }
          >
            {addDropStatus}
          </span>
        </div>

        <div className="advisor-toolbar">
          <label>
            Term
            <select
              value={term}
              disabled={busy || loading}
              onChange={(event) =>
                setTerm(event.target.value)
              }
            >
              {terms.map((item) => (
                <option key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            className="success-button"
            disabled={
              busy ||
              loading ||
              !visible.length
            }
            onClick={() =>
              mutate(
                "/advisor/add-drop",
                "PATCH",
                {
                  term,
                  open: true,
                },
                "Add/Drop opened"
              )
            }
          >
            Open Add/Drop
          </button>

          <button
            className="danger-button"
            disabled={
              busy ||
              loading ||
              !visible.length
            }
            onClick={() =>
              mutate(
                "/advisor/add-drop",
                "PATCH",
                {
                  term,
                  open: false,
                },
                "Add/Drop closed"
              )
            }
          >
            Close Add/Drop
          </button>
        </div>

        {!loading && !visible.length && (
          <div className="empty-state">
            No offerings in this term.
          </div>
        )}

        {!!visible.length && (
          <Table
            headers={[
              "Course",
              "Section",
              "Day",
              "Time",
              "Room",
              "Instructor",
              "Seats",
              "Taken",
              "Remaining",
              "Add/Drop",
              "Actions",
            ]}
          >
            {visible.map((offering) => (
              <tr key={offering._id}>
                <td>
                  <strong>
                    {offering.courseId?.code}
                  </strong>

                  <div className="table-subtext">
                    {offering.courseId?.title}
                  </div>
                </td>

                <td>{offering.section}</td>

                <td>{offering.day}</td>

                <td>
                  {offering.startTime}–
                  {offering.endTime}
                </td>

                <td>{offering.room}</td>

                <td>
                  {offering.instructor}
                </td>

                <td>{offering.seats}</td>

                <td>
                  {offering.seatsTaken}
                </td>

                <td>
                  {offering.seatsRemaining}
                </td>

                <td>
                  <span
                    className={
                      offering.addDropOpen
                        ? "status-badge active"
                        : "status-badge inactive"
                    }
                  >
                    {offering.addDropOpen
                      ? "Open"
                      : "Closed"}
                  </span>
                </td>

                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="small-button"
                      disabled={busy}
                      onClick={() =>
                        editOffering(offering)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="danger-button small-button"
                      disabled={busy}
                      onClick={() => {
                        setDeleteTarget(
                          offering
                        );

                        setDeleteError("");
                        setMessage("");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <div className="panel advisor-section">
        <div className="section-heading">
          <div>
            <h2>
              Student Registration
            </h2>

            <p>
              Review student history, eligibility and
              current registrations.
            </p>
          </div>
        </div>

        <div className="student-selector">
          <label>
            Student
          </label>

          <select
            value={studentId}
            disabled={busy || loading}
            onChange={(event) =>
              setStudentId(event.target.value)
            }
          >
            <option value="">
              Select a student
            </option>

            {students.map((student) => (
              <option
                key={student._id}
                value={student._id}
              >
                {student.studentId} —{" "}
                {student.name}
              </option>
            ))}
          </select>
        </div>

        {studentError && (
          <p
            className="error"
            role="alert"
          >
            {studentError}
          </p>
        )}

        {studentLoading && (
          <div className="info-box">
            Loading student information...
          </div>
        )}

        {!studentId &&
          !studentLoading && (
            <div className="empty-state">
              Select a student to view
              eligibility and registration
              information.
            </div>
          )}

        {studentId && dataReady && (
          <>
            <div className="advisor-subsection">
              <h3>
                Course Eligibility · {term}
              </h3>

              <p className="muted">
                Failed courses appear first.
                Retakes can be registered when
                all other rules allow them.
              </p>

              {!eligibility.length ? (
                <div className="empty-state">
                  No offerings in this term.
                </div>
              ) : (
                <Table
                  headers={[
                    "Course",
                    "Section",
                    "Day",
                    "Time",
                    "Room",
                    "Seats",
                    "Retake",
                    "Eligibility",
                    "Reason",
                  ]}
                >
                  {eligibility.map(
                    (offering) => (
                      <tr
                        key={offering._id}
                        className={[
                          offering.eligible
                            ? "eligibility-eligible"
                            : "eligibility-blocked",

                          offering.retakeRequired
                            ? "retake-row"
                            : "",
                        ].join(" ")}
                      >
                        <td>
                          <strong>
                            {
                              offering.courseId
                                ?.code
                            }
                          </strong>

                          <div className="table-subtext">
                            {
                              offering.courseId
                                ?.title
                            }
                          </div>
                        </td>

                        <td>
                          {offering.section}
                        </td>

                        <td>
                          {offering.day}
                        </td>

                        <td>
                          {
                            offering.startTime
                          }
                          –
                          {
                            offering.endTime
                          }
                        </td>

                        <td>
                          {offering.room}
                        </td>

                        <td>
                          {
                            offering.seatsRemaining
                          }
                        </td>

                        <td>
                          {offering.retakeRequired ? (
                            <span className="retake-badge">
                              Retake required
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              offering.eligible
                                ? "status-badge active"
                                : "status-badge inactive"
                            }
                          >
                            {offering.eligible
                              ? "Eligible"
                              : "Blocked"}
                          </span>
                        </td>

                        <td>
                          {offering.reason ||
                            "—"}
                        </td>
                      </tr>
                    )
                  )}
                </Table>
              )}
            </div>

            <div className="registration-card">
              <h3>
                Register Student
              </h3>

              <form
                onSubmit={(event) => {
                  event.preventDefault();

                  if (!canRegister) {
                    if (
                      !busy &&
                      !studentLoading
                    ) {
                      setError(
                        "Select an eligible offering before registering."
                      );
                    }

                    return;
                  }

                  mutate(
                    "/advisor/registrations",
                    "POST",
                    {
                      studentId,
                      offeringId:
                        selectedOffering._id,
                      term,
                    },
                    "Student registered"
                  );
                }}
              >
                <fieldset
                  disabled={
                    busy ||
                    loading ||
                    studentLoading ||
                    !dataReady ||
                    !eligibility.length
                  }
                >
                  <legend>
                    Register in {term}
                  </legend>

                  <div className="registration-controls">
                    <select
                      aria-label="Offering"
                      value={
                        selectedOffering?.eligible
                          ? offeringId
                          : ""
                      }
                      onChange={(event) =>
                        setOfferingId(
                          event.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Select an offering
                      </option>

                      {eligibility.map(
                        (offering) => (
                          <option
                            key={
                              offering._id
                            }
                            value={
                              offering._id
                            }
                            disabled={
                              !offering.eligible
                            }
                          >
                            {offering.courseId
                              ?.code ||
                              "Unknown"}{" "}
                            Section{" "}
                            {
                              offering.section
                            }{" "}
                            —{" "}
                            {offering.day}{" "}
                            {
                              offering.startTime
                            }
                            –
                            {
                              offering.endTime
                            }{" "}
                            —{" "}
                            {
                              offering.seatsRemaining
                            }{" "}
                            seats remaining
                            {offering.retakeRequired
                              ? " — Retake required"
                              : ""}
                            {!offering.eligible
                              ? ` — ${offering.reason}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      disabled={!canRegister}
                    >
                      Register Student
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>

            <div className="advisor-subsection">
              <h3>
                Current Registrations · {term}
              </h3>

              {!registrations.length ? (
                <div className="empty-state">
                  No current registrations in
                  this term.
                </div>
              ) : (
                <Table
                  headers={[
                    "Course",
                    "Section",
                    "Day",
                    "Time",
                    "Room",
                    "Instructor",
                    "Action",
                  ]}
                >
                  {registrations.map(
                    (registration) => {
                      const offering =
                        registration.offeringId;

                      return (
                        <tr
                          key={
                            registration._id
                          }
                        >
                          <td>
                            <strong>
                              {
                                offering
                                  ?.courseId
                                  ?.code
                              }
                            </strong>

                            <div className="table-subtext">
                              {
                                offering
                                  ?.courseId
                                  ?.title
                              }
                            </div>
                          </td>

                          <td>
                            {
                              offering?.section
                            }
                          </td>

                          <td>
                            {offering?.day}
                          </td>

                          <td>
                            {
                              offering?.startTime
                            }
                            –
                            {
                              offering?.endTime
                            }
                          </td>

                          <td>
                            {offering?.room}
                          </td>

                          <td>
                            {
                              offering?.instructor
                            }
                          </td>

                          <td>
                            {dropId ===
                            registration._id ? (
                              <div className="remove-confirmation">
                                <span>
                                  Remove
                                  registration?
                                </span>

                                <div className="table-actions">
                                  <button
                                    className="danger-button small-button"
                                    disabled={
                                      busy
                                    }
                                    onClick={() =>
                                      mutate(
                                        `/advisor/registrations/${registration._id}`,
                                        "DELETE",
                                        null,
                                        "Registration removed",
                                        () =>
                                          setDropId(
                                            null
                                          )
                                      )
                                    }
                                  >
                                    Confirm
                                  </button>

                                  <button
                                    className="secondary-button small-button"
                                    disabled={
                                      busy
                                    }
                                    onClick={() =>
                                      setDropId(
                                        null
                                      )
                                    }
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                className="danger-button small-button"
                                disabled={
                                  busy
                                }
                                onClick={() => {
                                  setDropId(
                                    registration._id
                                  );

                                  setError(
                                    ""
                                  );
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </Table>
              )}
            </div>

            <div className="advisor-subsection">
              <h3>
                Academic Records · All Terms
              </h3>

              {!records.length ? (
                <div className="empty-state">
                  No academic records.
                </div>
              ) : (
                <Table
                  headers={[
                    "Term",
                    "Course",
                    "Credits",
                    "Grade",
                  ]}
                >
                  {records.map(
                    (record) => (
                      <tr
                        key={record._id}
                      >
                        <td>
                          {record.term}
                        </td>

                        <td>
                          <strong>
                            {
                              record.courseId
                                ?.code
                            }
                          </strong>

                          <div className="table-subtext">
                            {
                              record.courseId
                                ?.title
                            }
                          </div>
                        </td>

                        <td>
                          {
                            record.courseId
                              ?.credits
                          }
                        </td>

                        <td>
                          <span className="grade-badge">
                            {
                              record.grade
                            }
                          </span>

                          {record.grade ===
                            "F" && (
                            <span className="retake-badge">
                              Retake
                              required
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </Table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}