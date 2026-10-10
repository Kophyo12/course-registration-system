import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getUser, clearSession } from "../api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "student",
  studentId: "",
  active: true,
};

function AdminDashboard() {
  const me = getUser();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = creating
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const query = roleFilter ? `?role=${roleFilter}` : "";
      const data = await apiFetch(`/admin/users${query}`);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  }

  // Reload the list when the page opens and whenever the filter changes
  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  function handleLogout() {
    clearSession();
    navigate("/");
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  function startEdit(user) {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      studentId: user.studentId || "",
      active: user.active,
    });
    setMessage("");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingId) {
        const body = {
          name: form.name,
          email: form.email,
          role: form.role,
          studentId: form.studentId,
          active: form.active,
        };
        if (form.password) body.password = form.password;
        await apiFetch(`/admin/users/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setMessage("User updated");
      } else {
        await apiFetch("/admin/users", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setMessage("User created");
      }
      cancelEdit();
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(user) {
    const ok = window.confirm(`Deactivate ${user.name}? They will no longer be able to log in.`);
    if (!ok) return;
    setMessage("");
    setError("");
    try {
      await apiFetch(`/admin/users/${user._id}`, { method: "DELETE" });
      setMessage(`${user.name} deactivated`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReactivate(user) {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/admin/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: true }),
      });
      setMessage(`${user.name} reactivated`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
  <div className="dashboard-page">
    <div className="dashboard-header">
      <div>
        <h1>Admin Dashboard</h1>
        <p>
          Logged in as <strong>{me.name}</strong> ({me.role})
        </p>
      </div>

      <button className="secondary-button" onClick={handleLogout}>
        Logout
      </button>
    </div>

    {message && <p className="success-message">{message}</p>}
    {error && <p className="error">{error}</p>}

    <div className="admin-grid">
      <div className="panel">
        <h2>{editingId ? "Edit User" : "Create User"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              {editingId
                ? "New password (leave blank to keep old one)"
                : "Password"}
            </label>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required={!editingId}
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="admin">Admin</option>
              <option value="advisor">Advisor</option>
              <option value="student">Student</option>
            </select>
          </div>

          {form.role === "student" && (
            <div className="form-group">
              <label>Student ID</label>
              <input
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {editingId && (
            <div className="checkbox-row">
              <input
                name="active"
                type="checkbox"
                checked={form.active}
                onChange={handleChange}
              />
              <label>Active account</label>
            </div>
          )}

          <div className="form-actions">
            <button type="submit">
              {editingId ? "Save Changes" : "Create User"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel users-panel">
        <div className="panel-header">
          <div>
            <h2>Users</h2>
            <p>{users.length} users found</p>
          </div>

          <select
            className="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="advisor">Advisor</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Student ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>

                  <td>
                    <span className="role-badge">
                      {user.role}
                    </span>
                  </td>

                  <td>{user.studentId || "-"}</td>

                  <td>
                    <span
                      className={
                        user.active
                          ? "status-badge active"
                          : "status-badge inactive"
                      }
                    >
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        className="small-button"
                        onClick={() => startEdit(user)}
                      >
                        Edit
                      </button>

                      {user.active ? (
                        <button
                          className="danger-button small-button"
                          onClick={() => handleDelete(user)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="success-button small-button"
                          onClick={() => handleReactivate(user)}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);}

export default AdminDashboard;