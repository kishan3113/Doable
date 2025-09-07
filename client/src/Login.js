import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001";

const Login = () => {
  const [role, setRole] = useState("worker"); // 'worker' or 'customer'
  const [name, setName] = useState(""); // worker login uses name
  const [email, setEmail] = useState(""); // customer login uses email
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("hw-login-remember");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role) setRole(parsed.role);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        setRemember(true);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    setError("");
    setPassword("");
    if (role === "worker") {
      setTimeout(() => nameRef.current?.focus(), 0);
    } else {
      setTimeout(() => emailRef.current?.focus(), 0);
    }
  }, [role]);

  const validateForm = () => {
    if (role === "worker") {
      if (!name.trim()) {
        setError("Please enter your worker name.");
        return false;
      }
    } else {
      if (!email.trim()) {
        setError("Please enter your email.");
        return false;
      }
      const re = /\S+@\S+\.\S+/;
      if (!re.test(email)) {
        setError("Please enter a valid email address.");
        return false;
      }
    }
    if (!password) {
      setError("Please enter your password.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (role === "worker") {
        const res = await axios.post(`${API_BASE}/api/auth/login`, {
          name: name.trim(),
          password,
        });

        if (res.data?.success) {
          if (remember) {
            localStorage.setItem("hw-login-remember", JSON.stringify({ role, name }));
          } else {
            localStorage.removeItem("hw-login-remember");
          }
          navigate("/worker-dashboard", { state: res.data });
        } else {
          setError(res.data?.message || "Worker login failed.");
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/customers/login`, {
          email: email.trim(),
          password,
        });

        if (res.data?.success) {
          if (remember) {
            localStorage.setItem("hw-login-remember", JSON.stringify({ role, email }));
          } else {
            localStorage.removeItem("hw-login-remember");
          }
          navigate("/customer-dashboard", { state: res.data });
        } else {
          setError(res.data?.message || "Customer login failed.");
        }
      }
    } catch (err) {
      console.error("Login error:", err?.response?.data || err?.message);
      setError(err?.response?.data?.message || "Login failed. Check credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #2c3e50, #3498db)",
    fontFamily: "Poppins, sans-serif",
    padding: 16,
  };

  const cardStyle = {
    width: "100%",
    maxWidth: 460,
    background: "#fff",
    borderRadius: 12,
    padding: 28,
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
  };

  const roleBtn = (isActive) => ({
    flex: 1,
    padding: 12,
    marginRight: 8,
    backgroundColor: isActive ? "#3498db" : "#ecf0f1",
    color: isActive ? "#fff" : "#2c3e50",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  });

  const inputBase = {
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #e6eef8",
    outline: "none",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle} role="region" aria-labelledby="login-heading">
        <h2 id="login-heading" style={{ textAlign: "center", marginBottom: 18, color: "#2c3e50" }}>
          {role === "worker" ? "Worker Login" : "Customer Login"}
        </h2>

        {/* Role Switch */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <button
            onClick={() => setRole("worker")}
            style={roleBtn(role === "worker")}
            aria-pressed={role === "worker"}
            type="button"
          >
            Worker
          </button>
          <button
            onClick={() => setRole("customer")}
            style={{ ...roleBtn(role === "customer"), marginRight: 0 }}
            aria-pressed={role === "customer"}
            type="button"
          >
            Customer
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {role === "worker" ? (
            <label style={{ display: "block" }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: "#344055", fontWeight: 600 }}>Worker Name</div>
              <input
                ref={nameRef}
                type="text"
                placeholder="Enter your worker name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputBase}
                disabled={loading}
                autoComplete="username"
                required
              />
            </label>
          ) : (
            <label style={{ display: "block" }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: "#344055", fontWeight: 600 }}>Customer Email</div>
              <input
                ref={emailRef}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputBase}
                disabled={loading}
                autoComplete="email"
                required
              />
            </label>
          )}

          <label style={{ display: "block" }}>
            <div style={{ marginBottom: 6, fontSize: 13, color: "#344055", fontWeight: 600 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputBase, paddingRight: 44 }}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 8,
                  top: 6,
                  bottom: 6,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "6px 8px",
                  color: "#475569",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

         

          {error && (
            <div role="alert" style={{ color: "#b91c1c", fontSize: 14, padding: "8px 10px", background: "#fff1f2", borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              background: loading ? "#8ec7ea" : "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        {/* Register Links — show only for current role */}
        <div style={{ marginTop: 16, textAlign: "center", fontSize: 14, color: "#475569" }}>
          {role === "worker" ? (
            <p>
              New Worker?{" "}
              <button
                onClick={() => navigate("/register-worker")}
                style={{ background: "none", border: "none", color: "#3498db", cursor: "pointer" }}
              >
                Create account
              </button>
            </p>
          ) : (
            <p>
              New Customer?{" "}
              <button
                onClick={() => navigate("/register-customer")}
                style={{ background: "none", border: "none", color: "#3498db", cursor: "pointer" }}
              >
                Create account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
