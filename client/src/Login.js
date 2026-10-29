import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { DEMO_ENABLED, startDemo, stopDemo } from "./demoApi";

import AuthLayout from "./AuthLayout";
import { Field, Icon } from "./SiteUI";

const API_BASE = "https://doable-ojum.onrender.com";

const Login = () => {
  const location = useLocation();
  const requestedRole = new URLSearchParams(location.search).get("role");
  const [role, setRole] = useState(requestedRole || "customer"); // 'worker' or 'customer'
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
    stopDemo();
    const saved = localStorage.getItem("hw-login-remember");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role && !requestedRole) setRole(parsed.role);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        setRemember(true);
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setError("enter your name.");
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

    stopDemo();
    setLoading(true);
    try {
      if (role === "worker") {
        const res = await axios.post(`${API_BASE}/api/auth/login`, {
          name: name.trim(),
          password,
        });

        if (res.data?.success) {
          if (remember) {
            localStorage.setItem(
              "hw-login-remember",
              JSON.stringify({ role, name }),
            );
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
            localStorage.setItem(
              "hw-login-remember",
              JSON.stringify({ role, email }),
            );
          } else {
            localStorage.removeItem("hw-login-remember");
          }
          navigate("/customer-dashboard", {
            state: {
              ...res.data,
              selectedWorker: location.state?.selectedWorker,
              activeTab: location.state?.selectedWorker
                ? "bookWorker"
                : "profile",
            },
          });
        } else {
          setError(res.data?.message || "Customer login failed.");
        }
      }
    } catch (err) {
      console.error("Login error:", err?.response?.data || err?.message);
      setError(
        err?.response?.data?.message ||
          "Login failed. Check credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openDemo = (demoRole) => {
    const account = startDemo(demoRole);
    navigate(`/${demoRole}-dashboard`, {
      state: {
        ...account,
        demoSelectionReset:
          demoRole === "customer" &&
          location.state?.selectedWorker &&
          location.state.selectedWorker._id !== "000000000000000000000001",
        ...(demoRole === "customer" &&
        location.state?.selectedWorker?._id === "000000000000000000000001"
          ? {
              selectedWorker: location.state.selectedWorker,
              activeTab: "bookWorker",
            }
          : {}),
      },
    });
  };
  return (
    <AuthLayout worker={role === "worker"}>
      <span className="eyebrow">WELCOME BACK</span>
      <h2>Your next chapter starts here.</h2>
      <p className="subcopy">Log in to your Doable account.</p>
      <div className="role-switch" aria-label="Account type">
        {["customer", "worker"].map((r) => (
          <button
            key={r}
            type="button"
            className={role === r ? "active" : ""}
            aria-pressed={role === r}
            onClick={() => setRole(r)}
          >
            {r === "customer" ? "I need a helping hand" : "I’m a professional"}
          </button>
        ))}
      </div>
      {location.state?.registered && (
        <p className="notice" style={{ marginBottom: 20 }}>
          Your account is ready. Log in to get started.
        </p>
      )}
      <form onSubmit={handleLogin} className="form-stack">
        {role === "worker" ? (
          <Field label="Worker name">
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="username"
              placeholder="Your registered name"
              disabled={loading}
              required
            />
          </Field>
        ) : (
          <Field label="Email address">
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              disabled={loading}
              required
            />
          </Field>
        )}
        <Field label="Password">
          <div className="password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>
        <label className="small muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />{" "}
          Remember my {role === "worker" ? "name" : "email"}
        </label>
        {error && (
          <p role="alert" className="notice notice-error">
            {error}
          </p>
        )}
        <button className="button" disabled={loading}>
          {loading ? "Signing in…" : "Log in"} <Icon />
        </button>
      </form>
      <p className="auth-footer">
        New to Doable?{" "}
        <Link
          to={role === "worker" ? "/register-worker" : "/register-customer"}
          state={
            role === "customer"
              ? { selectedWorker: location.state?.selectedWorker }
              : undefined
          }
        >
          Create an account
        </Link>
      </p>
      {DEMO_ENABLED && (
        <div className="demo-box">
          <h4>Take a look around</h4>
          <p>
            Try a local demo. No password needed. Sample changes stay in this
            browser.
          </p>
          <div className="demo-buttons">
            <button
              className="button button-outline"
              onClick={() => openDemo("customer")}
            >
              Try customer demo ↗
            </button>
            <button
              className="button button-outline"
              onClick={() => openDemo("worker")}
            >
              Try worker demo ↗
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
export default Login;
