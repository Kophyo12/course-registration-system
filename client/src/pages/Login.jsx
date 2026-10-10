import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, saveSession } from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveSession(data.token, data.user);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">CR</div>

          <div>
            <h1>Course Registration System</h1>
            <p>University Academic Portal</p>
          </div>
        </div>

        <div className="login-content">
          <h2>Welcome back</h2>
          <p className="muted">
            Sign in to access your course registration account.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button className="login-button" type="submit">
              Sign In
            </button>
          </form>
        </div>

        <p className="login-footer">
          Course Registration System · CSC220
        </p>
      </div>
    </div>
  );
}

export default Login;