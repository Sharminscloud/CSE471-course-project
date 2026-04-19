import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import logo from "./assets/logo.png";

function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage]   = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:1163/api/auth/login", { email, password });
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "460px" }}>
        <div className="hero" style={{ justifyContent: "center" }}>
          <img src={logo} alt="EQueue Logo" className="logo" />
        </div>
        <div className="card">
          <h2 style={{ textAlign: "center" }}>Login</h2>
          {message && <div className="message">{message}</div>}
          <form className="form" style={{ gridTemplateColumns: "1fr" }} onSubmit={handleLogin}>
            <input type="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Login</button>
          </form>
          <p style={{ textAlign: "center", marginTop: "16px", color: "#94a3b8" }}>
            No account? <Link to="/signup" style={{ color: "#60a5fa" }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;