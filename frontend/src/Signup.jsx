import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import logo from "./assets/logo.png";

function Signup() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage]   = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:1163/api/auth/register", { name, email, password });
      setMessage("Account created! Redirecting to login...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "460px" }}>
        <div className="hero" style={{ justifyContent: "center" }}>
          <img src={logo} alt="EQueue Logo" className="logo" />
        </div>
        <div className="card">
          <h2 style={{ textAlign: "center" }}>Sign Up</h2>
          {message && <div className="message">{message}</div>}
          <form className="form" style={{ gridTemplateColumns: "1fr" }} onSubmit={handleSignup}>
            <input type="text" placeholder="Full Name"
              value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password (min 6 characters)"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Create Account</button>
          </form>
          <p style={{ textAlign: "center", marginTop: "16px", color: "#94a3b8" }}>
            Have an account? <Link to="/" style={{ color: "#60a5fa" }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;