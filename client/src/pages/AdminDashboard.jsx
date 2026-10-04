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
    <div className="box">
      <h1>Admin Dashboard</h1>
      <p>
        Logged in as {me.name} ({me.role}){" "}
        <button onClick={handleLogout}>Logout</button>
      </p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p className="error">{error}</p>}

      <h2>{editingId ? "Edit user" : "Create user"}</h2>
      <form onSubmit={handleSubmit}>
        <p>
          <label>Name<br />
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
        </p>
        <p>
          <label>Email<br />
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
        </p>
        <p>
          <label>
            {editingId ? "New password (leave blank to keep the old one)" : "Password"}
            <br />
            <input name="password" type="password" value={form.password}
              onChange={handleChange} required={!editingId} />
          </label>
        </p>
        <p>
          <label>Role<br />
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="admin">admin</option>
              <option value="advisor">advisor</option>
              <option value="student">student</option>
            </select>
          </label>
        </p>
        {form.role === "student" && (
          <p>
            <label>Student ID<br />
              <input name="studentId" value={form.studentId} onChange={handleChange} required />
            </label>
          </p>
        )}
        {editingId && (
          <p>
            <label>
              <input name="active" type="checkbox" checked={form.active} onChange={handleChange} />
              {" "}Active
            </label>
          </p>
        )}
        <button type="submit">{editingId ? "Save changes" : "Create user"}</button>{" "}
        {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
      </form>

      <h2>Users</h2>
      <p>
        <label>Filter by role:{" "}
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All</option>
            <option value="admin">admin</option>
            <option value="advisor">advisor</option>
            <option value="student">student</option>
          </select>
        </label>
        {" "}({users.length} users)
      </p>

      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
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
              <td>{user.role}</td>
              <td>{user.studentId || "-"}</td>
              <td>{user.active ? "Active" : "Inactive"}</td>
              <td>
                <button onClick={() => startEdit(user)}>Edit</button>{" "}
                {user.active ? (
                  <button onClick={() => handleDelete(user)}>Deactivate</button>
                ) : (
                  <button onClick={() => handleReactivate(user)}>Reactivate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;