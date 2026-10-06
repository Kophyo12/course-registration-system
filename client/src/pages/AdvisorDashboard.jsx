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

const actionStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  whiteSpace: "nowrap",
};

function courseName(course) {
  return course
    ? `${course.code} — ${course.title}`
    : "Course unavailable";
}

function Table({ headers, children }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 16 }}>
      <table
        border="1"
        cellPadding="6"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
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

// Native dialog provides keyboard focus handling and a backdrop.
function DeleteDialog({ offering, busy, error, onCancel, onConfirm }) {
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
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      style={{
        border: "none",
        borderRadius: "8px",
        padding: "24px",
        width: "min(420px, calc(100vw - 48px))",
        boxSizing: "border-box",
        background: "white",
        color: "#222",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
      }}
    >
      <h2 id="delete-title" style={{ marginTop: 0 }}>
        Delete Offering?
      </h2>

      <p id="delete-description">
        Are you sure you want to delete{" "}
        <strong>{courseName(offering.courseId)}</strong>?
      </p>

      <p>
        Section {offering.section} · Term {offering.term}
      </p>

      <p>
        This cannot be undone. Offerings with registration
        history cannot be deleted.
      </p>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div
        style={{
          ...actionStyle,
          justifyContent: "flex-end",
          marginTop: "20px",
        }}
      >
        <button
          type="button"
          autoFocus
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          style={{
            background: "#b42318",
            color: "white",
            border: "1px solid #b42318",
            padding: "8px 14px",
            borderRadius: "4px",
          }}
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
          `/advisor/students/${studentId}/registrations?term=${encodeURIComponent(term)}`
        ),
      ])
        .then(([history, registrations]) => {
          if (active) {
            setStudentData({
              key: `${studentId}:${term}:${revision}`,
              records: history.records,
              registrations,
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

  const records = dataReady ? studentData.records : [];

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
    setForm((previous) => ({ ...previous, [name]: value }));
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
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      after?.();
      setMessage(success);
      setRevision((value) => value + 1);

      try {
        setOfferings(await apiFetch("/advisor/offerings"));
      } catch {
        setError(
          "Change saved, but refresh failed. Reload the page before continuing."
        );
      }
    } catch (err) {
      if (deletion) setDeleteError(err.message);
      else setError(err.message);
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
      editingId ? "Offering updated" : "Offering created",
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
        if (editingId === id) resetForm();
        cancelDelete();
      },
      true
    );
  }

  return (
    <div className="box">
      <h1>Advisor Dashboard</h1>

      {deleteTarget && (
        <DeleteDialog
          offering={deleteTarget}
          busy={busy}
          error={deleteError}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      <p>
        Logged in as {user?.name}{" "}
        <button
          disabled={busy}
          onClick={() => {
            clearSession();
            navigate("/");
          }}
        >
          Logout
        </button>
      </p>

      {error && (
        <p className="error" role="alert">{error}</p>
      )}

      {message && (
        <p style={{ color: "green" }} role="status">
          {message}
        </p>
      )}

      {loading && <p>Loading dashboard...</p>}

      <h2>
        {editingId ? "Edit Offering" : "Create Offering"}
      </h2>

      {editingId && (
        <p>Course, term, and section stay fixed.</p>
      )}

      <form onSubmit={saveOffering}>
        <fieldset disabled={busy || loading}>
          <legend>Section details</legend>

          <p>
            <label>
              Course<br />
              <select
                name="courseId"
                value={form.courseId}
                onChange={changeField}
                disabled={Boolean(editingId)}
                required
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {courseName(course)}
                  </option>
                ))}
              </select>
            </label>
          </p>

          {fields.map(([name, label, type]) => (
            <p key={name}>
              <label>
                {label}<br />
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={changeField}
                  min={type === "number" ? 1 : undefined}
                  step={type === "number" ? 1 : undefined}
                  disabled={
                    Boolean(editingId) &&
                    ["term", "section"].includes(name)
                  }
                  required
                />
              </label>
            </p>
          ))}

          <p>
            <label>
              Day<br />
              <select
                name="day"
                value={form.day}
                onChange={changeField}
              >
                {days.map((day) => (
                  <option key={day}>{day}</option>
                ))}
              </select>
            </label>
          </p>

          <div style={actionStyle}>
            <button
              disabled={!editingId && !courses.length}
            >
              {busy
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Offering"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </fieldset>
      </form>

      <h2>Offerings and Add/Drop</h2>

      <p>
        <label>
          Term:{" "}
          <select
            value={term}
            disabled={busy || loading}
            onChange={(event) => setTerm(event.target.value)}
          >
            {terms.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </p>

      <div style={{ ...actionStyle, marginBottom: 16 }}>
        <span>
          Add/Drop: <strong>{addDropStatus}</strong>
        </span>

        <button
          disabled={busy || loading || !visible.length}
          onClick={() =>
            mutate(
              "/advisor/add-drop",
              "PATCH",
              { term, open: true },
              "Add/Drop opened"
            )
          }
        >
          Open
        </button>

        <button
          disabled={busy || loading || !visible.length}
          onClick={() =>
            mutate(
              "/advisor/add-drop",
              "PATCH",
              { term, open: false },
              "Add/Drop closed"
            )
          }
        >
          Close
        </button>
      </div>

      {!loading && !visible.length && (
        <p>No offerings in this term.</p>
      )}

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
            <td>{courseName(offering.courseId)}</td>
            <td>{offering.section}</td>
            <td>{offering.day}</td>
            <td>{offering.startTime}–{offering.endTime}</td>
            <td>{offering.room}</td>
            <td>{offering.instructor}</td>
            <td>{offering.seats}</td>
            <td>{offering.seatsTaken}</td>
            <td>{offering.seatsRemaining}</td>
            <td>
              {offering.addDropOpen ? "Open" : "Closed"}
            </td>

            <td>
              <div style={actionStyle}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => editOffering(offering)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setDeleteTarget(offering);
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

      <h2>Student Registration</h2>

      <p>
        <label>
          Student:{" "}
          <select
            value={studentId}
            disabled={busy || loading}
            onChange={(event) => setStudentId(event.target.value)}
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.studentId} — {student.name}
              </option>
            ))}
          </select>
        </label>
      </p>

      {studentError && (
        <p className="error" role="alert">
          {studentError}
        </p>
      )}

      {studentLoading && (
        <p>Loading student information...</p>
      )}

      {studentId && dataReady && (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();

              mutate(
                "/advisor/registrations",
                "POST",
                { studentId, offeringId },
                "Student registered"
              );
            }}
          >
            <fieldset disabled={busy || !visible.length}>
              <legend>Register in {term}</legend>

              <select
                aria-label="Offering"
                value={offeringId}
                onChange={(event) => setOfferingId(event.target.value)}
                required
              >
                <option value="">Select an offering</option>

                {visible.map((offering) => (
                  <option
                    key={offering._id}
                    value={offering._id}
                    disabled={registrations.some(
                      (registration) =>
                        registration.offeringId?._id === offering._id
                    )}
                  >
                    {offering.courseId?.code || "Unknown"}{" "}
                    Section {offering.section} — {offering.day}{" "}
                    {offering.startTime}–{offering.endTime} —{" "}
                    {offering.seatsRemaining} seats remaining
                  </option>
                ))}
              </select>
              {" "}

              <button disabled={!offeringId}>
                Register Student
              </button>
            </fieldset>
          </form>

          <h3>Current registrations — {term}</h3>

          {!registrations.length ? (
            <p>No current registrations in this term.</p>
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
              {registrations.map((registration) => {
                const offering = registration.offeringId;

                return (
                  <tr key={registration._id}>
                    <td>{courseName(offering?.courseId)}</td>
                    <td>{offering?.section}</td>
                    <td>{offering?.day}</td>
                    <td>
                      {offering?.startTime}–{offering?.endTime}
                    </td>
                    <td>{offering?.room}</td>
                    <td>{offering?.instructor}</td>

                    <td>
                      {dropId === registration._id ? (
                        <>
                          <p>Remove registration?</p>

                          <div style={actionStyle}>
                            <button
                              disabled={busy}
                              onClick={() =>
                                mutate(
                                  `/advisor/registrations/${registration._id}`,
                                  "DELETE",
                                  null,
                                  "Registration removed",
                                  () => setDropId(null)
                                )
                              }
                            >
                              Confirm Remove
                            </button>

                            <button
                              disabled={busy}
                              onClick={() => setDropId(null)}
                            >
                              Cancel
                            </button>
                          </div>

                          {error && (
                            <p className="error">{error}</p>
                          )}
                        </>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={() => {
                            setDropId(registration._id);
                            setError("");
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}

          <h3>Academic records — all terms</h3>

          {!records.length ? (
            <p>No academic records.</p>
          ) : (
            <Table headers={["Term", "Course", "Credits", "Grade"]}>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>{record.term}</td>
                  <td>{courseName(record.courseId)}</td>
                  <td>{record.courseId?.credits}</td>
                  <td>{record.grade}</td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
}