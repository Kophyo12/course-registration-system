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
      navigate(`/${data.user.role}`); // /admin, /advisor or /student
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="box">
      <h1>Course Registration System</h1>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <p>
          <label>Email<br />
            <input type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </label>
        </p>
        <p>
          <label>Password<br />
            <input type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </label>
        </p>
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;