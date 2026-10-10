import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getUser, clearSession } from "../api";


function StudentDashboard() {
  const me = getUser();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [records, setRecords] = useState({ terms: [], summary: null });
  const [addDrop, setAddDrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load all three parts of the page once when it opens.
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [courseData, recordData, addDropData] = await Promise.all([
          apiFetch("/student/registrations"),
          apiFetch("/student/records"),
          apiFetch("/student/add-drop"),
        ]);
        setCourses(courseData);
        setRecords(recordData);
        setAddDrop(addDropData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function handleLogout() {
    clearSession();
    navigate("/");
  }

  const summary = records.summary;

  return (
  <div className="dashboard-page">
    <div className="dashboard-header">
      <div>
        <h1>Student Dashboard</h1>
        <p>
          Welcome, <strong>{me?.name}</strong>
          {me?.studentId ? ` · ${me.studentId}` : ""}
        </p>
      </div>

      <button className="secondary-button" onClick={handleLogout}>
        Logout
      </button>
    </div>

    {error && <p className="error">{error}</p>}
    {loading && <p>Loading dashboard...</p>}

    {!loading && !error && (
      <>
        <div className="summary-grid">
          <div className="summary-card">
            <span>GPA</span>
            <strong>
              {summary?.gpa != null
                ? summary.gpa.toFixed(2)
                : "—"}
            </strong>
          </div>

          <div className="summary-card">
            <span>Credits Earned</span>
            <strong>{summary?.creditsEarned ?? 0}</strong>
          </div>

          <div className="summary-card">
            <span>Current Courses</span>
            <strong>{courses.length}</strong>
          </div>

          <div className="summary-card">
            <span>Add / Drop</span>
            <strong
              className={
                addDrop?.open ? "text-success" : "text-danger"
              }
            >
              {addDrop?.open ? "Open" : "Closed"}
            </strong>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Current Courses</h2>
              <p>Your active course registrations.</p>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="empty-state">
              You are not registered in any courses.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Instructor</th>
                  </tr>
                </thead>

                <tbody>
                  {courses.map((course) => (
                    <tr key={course.registrationId}>
                      <td>{course.term}</td>

                      <td>
                        <strong>{course.code}</strong>
                        <div className="table-subtext">
                          {course.title}
                        </div>
                      </td>

                      <td>{course.section}</td>
                      <td>{course.day}</td>
                      <td>
                        {course.startTime}–{course.endTime}
                      </td>
                      <td>{course.room}</td>
                      <td>{course.instructor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Add / Drop</h2>
              <p>
                Course change request information for the current term.
              </p>
            </div>

            {addDrop && (
              <span
                className={
                  addDrop.open
                    ? "status-badge active"
                    : "status-badge inactive"
                }
              >
                {addDrop.open ? "Open" : "Closed"}
              </span>
            )}
          </div>

          {addDrop && (
            <>
              <p>
                <strong>Term:</strong> {addDrop.term}
              </p>

              {addDrop.open && addDrop.deadline && (
                <p>
                  <strong>Deadline:</strong>{" "}
                  {new Date(
                    addDrop.deadline
                  ).toLocaleDateString()}
                </p>
              )}

              {!addDrop.open && (
                <div className="info-box">
                  Add/Drop requests are not being accepted right now.
                </div>
              )}

              {addDrop.open && (
                <div className="add-drop-card">
                  <h3>Request Add / Drop</h3>

                  <ol>
                    <li>
                      Download the{" "}
                      <a href="/add-drop-form.pdf" download>
                        Add/Drop Request Form
                      </a>
                      .
                    </li>

                    <li>
                      Fill in the courses and sections you want to
                      add or drop.
                    </li>

                    <li>
                      Sign the form and email it to your advisor.
                    </li>

                    <li>
                      Check this dashboard later for the registration
                      update.
                    </li>
                  </ol>

                  <div className="request-details">
                    <p>
                      <strong>Advisor</strong>
                      <br />
                      {addDrop.advisor
                        ? `${addDrop.advisor.name} · ${addDrop.advisor.email}`
                        : "No advisor assigned"}
                    </p>

                    <p>
                      <strong>Email Subject</strong>
                      <br />
                      <code>{addDrop.emailSubject}</code>
                    </p>
                  </div>

                  {addDrop.advisor &&
                    !addDrop.advisor.active && (
                      <p className="error">
                        Your advisor account is inactive. Please
                        contact the admin.
                      </p>
                    )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Academic Records</h2>
              <p>Your completed courses grouped by term.</p>
            </div>
          </div>

          {records.terms.length === 0 ? (
            <div className="empty-state">
              No previous academic records.
            </div>
          ) : (
            records.terms.map((group) => (
              <div className="term-section" key={group.term}>
                <h3>Term {group.term}</h3>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Title</th>
                        <th>Credits</th>
                        <th>Grade</th>
                      </tr>
                    </thead>

                    <tbody>
                      {group.records.map((record) => (
                        <tr key={`${group.term}-${record.code}`}>
                          <td>
                            <strong>{record.code}</strong>
                          </td>
                          <td>{record.title}</td>
                          <td>{record.credits}</td>

                          <td>
                            <span className="grade-badge">
                              {record.grade}
                            </span>

                            {record.retakeRequired && (
                              <span className="retake-badge">
                                Retake required
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </>
    )}
  </div>
);
}

export default StudentDashboard;
