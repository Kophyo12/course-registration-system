import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdvisorDashboard from "./pages/AdvisorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import { getUser } from "./api";

function Protected({ role, children }) {
  const user = getUser();

  if (!user) return <Navigate to="/" />;

  if (user.role !== role) {
    return <Navigate to={`/${user.role}`} />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/admin"
          element={
            <Protected role="admin">
              <AdminDashboard />
            </Protected>
          }
        />

        <Route
          path="/advisor"
          element={
            <Protected role="advisor">
              <AdvisorDashboard />
            </Protected>
          }
        />

        <Route
          path="/student"
          element={
            <Protected role="student">
              <StudentDashboard />
            </Protected>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}