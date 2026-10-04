import { useNavigate } from "react-router-dom";
import { getUser, clearSession } from "../api";

function AdminDashboard() {
  const user = getUser();
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="box">
      <h1>Admin Dashboard</h1>
      <p>Logged in as {user.name} ({user.role})</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default AdminDashboard;