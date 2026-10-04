import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import { getUser } from "./api";

// Sends people back if they aren't logged in or have the wrong role
function Protected({ role, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/" />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} />;
  return children;
}

// Temporary pages: User 3 and User 5 will replace these
function Placeholder({ title }) {
  return <div className="box"><h1>{title}</h1><p>Coming soon.</p></div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
        <Route path="/advisor" element={<Protected role="advisor"><Placeholder title="Advisor Dashboard" /></Protected>} />
        <Route path="/student" element={<Protected role="student"><Placeholder title="Student Dashboard" /></Protected>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;