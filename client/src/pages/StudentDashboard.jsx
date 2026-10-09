import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getUser, clearSession } from "../api";

const tableStyle = { borderCollapse: "collapse", width: "100%" };

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
    <div className="box">
      <h1>Student Dashboard</h1>
      <p>
        Logged in as {me?.name}
        {me?.studentId ? ` (${me.studentId})` : ""}{" "}
        <button onClick={handleLogout}>Logout</button>
      </p>

      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <>
          <h2>Summary</h2>
          <p>
            <strong>GPA:</strong>{" "}
            {summary?.gpa != null ? summary.gpa.toFixed(2) : "No graded courses yet"}
            {" | "}
            <strong>Total credits earned:</strong> {summary?.creditsEarned ?? 0}
          </p>

          <h2>Current Courses</h2>
          {courses.length === 0 ? (
            <p>You are not registered in any courses.</p>
          ) : (
            <table border="1" cellPadding="6" style={tableStyle}>
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
                      {course.code} - {course.title}
                    </td>
                    <td>{course.section}</td>
                    <td>{course.day}</td>
                    <td>
                      {course.startTime}-{course.endTime}
                    </td>
                    <td>{course.room}</td>
                    <td>{course.instructor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>Add/Drop</h2>
          {addDrop && (
            <>
              <p>
                <strong>Term {addDrop.term}:</strong>{" "}
                <span style={{ color: addDrop.open ? "green" : "#b42318", fontWeight: "bold" }}>
                  {addDrop.open ? "Open" : "Closed"}
                </span>
                {addDrop.open && addDrop.deadline && (
                  <> (deadline: {new Date(addDrop.deadline).toLocaleDateString()})</>
                )}
              </p>

              {!addDrop.open && (
                <p>Add/Drop requests are not being accepted right now.</p>
              )}

              {addDrop.open && (
                <div style={{ border: "1px solid #ccc", padding: "10px 16px", marginBottom: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Request Add/Drop</h3>
                  <ol>
                    <li>
                      Download the{" "}
                      <a href="/add-drop-form.pdf" download>
                        Add/Drop Request Form (PDF)
                      </a>
                      .
                    </li>
                    <li>Fill in the courses and sections you want to add or drop, then sign it.</li>
                    <li>Email the completed form to your advisor using the subject below.</li>
                    <li>Your advisor will update your registration. Check this page for the change.</li>
                  </ol>
                  <p>
                    <strong>Advisor:</strong>{" "}
                    {addDrop.advisor
                      ? `${addDrop.advisor.name} (${addDrop.advisor.email})`
                      : "No advisor assigned. Please contact the admin."}
                  </p>
                  {addDrop.advisor && !addDrop.advisor.active && (
                    <p className="error">
                      Your advisor account is inactive. Please contact the admin.
                    </p>
                  )}
                  <p>
                    <strong>Required email subject:</strong> <code>{addDrop.emailSubject}</code>
                  </p>
                </div>
              )}
            </>
          )}

          <h2>Academic Records</h2>
          {records.terms.length === 0 ? (
            <p>No previous academic records.</p>
          ) : (
            records.terms.map((group) => (
              <div key={group.term}>
                <h3>Term {group.term}</h3>
                <table border="1" cellPadding="6" style={tableStyle}>
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
                        <td>{record.code}</td>
                        <td>{record.title}</td>
                        <td>{record.credits}</td>
                        <td>
                          {record.grade}
                          {record.retakeRequired && (
                            <strong style={{ color: "#b42318" }}> — Retake required</strong>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default StudentDashboard;
