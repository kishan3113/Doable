// src/CustomerAuthCard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import TrackRequest from "./TrackRequest";
import PersonList from "./PersonList";

function CustomerAuthCard() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [customer, setCustomer] = useState(null);

  // To handle which card is open
  const [activeCard, setActiveCard] = useState(null);

  // Persist login
  useEffect(() => {
    const savedCustomer = localStorage.getItem("customer");
    if (savedCustomer) setCustomer(JSON.parse(savedCustomer));
  }, []);

  useEffect(() => {
    if (customer) localStorage.setItem("customer", JSON.stringify(customer));
    else localStorage.removeItem("customer");
  }, [customer]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ---------------- Register ----------------
  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, email, password, phone } = formData;

    if (!name || !email || !password || !phone) {
      setMessage("All fields are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data } = await axios.post(
        "https://doable-ojum.onrender.com/api/customers",
        { name, email, password, phone },
        { headers: { "Content-Type": "application/json" } }
      );
      setMessage(data.message || "Registration successful!");
      setFormData({ name: "", email: "", password: "", phone: "" });
      setIsLogin(true);
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Login ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setMessage("Email and password are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data } = await axios.post(
        "https://doable-ojum.onrender.com/api/customers/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      setMessage(data.message || "Login successful!");
      setCustomer({
        _id: data.customerId,
        name: data.name,
        email: data.email,
      });
      setFormData({ name: "", email: "", password: "", phone: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Logout ----------------
  const handleLogout = () => {
    setCustomer(null);
    setActiveCard(null);
    setMessage("You have logged out.");
  };

  // ---------------- Styles ----------------
  const cardStyle = {
    maxWidth: 600,
    margin: "20px auto",
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  };
  const titleStyle = { margin: "0 0 12px", fontSize: 20 };
  const inputStyle = {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
  };
  const buttonStyle = {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    marginRight: 8,
  };
  const msgStyle = { marginTop: 10, color: "red" };

  const optionCardStyle = {
    padding: 20,
    border: "1px solid #ccc",
    borderRadius: 12,
    boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
    cursor: "pointer",
    marginBottom: 15,
    background: "#f9f9f9",
    textAlign: "center",
  };

  // ---------------- Dashboard View ----------------
  if (customer) {
    return (
      <div className="customer-dashboard-card" style={cardStyle}>
        <h2 style={titleStyle}>Welcome, {customer.name}</h2>
        <p><strong>ID:</strong> {customer._id}</p>
        <p><strong>Email:</strong> {customer.email}</p>

        {/* Logout */}
        <button onClick={handleLogout} style={buttonStyle}>Logout</button>

        {/* Dashboard Options */}
        <div style={{ marginTop: 20 }}>
          <h3>Dashboard Options</h3>

          {/* Card 2 → Track Booking */}
          <div style={optionCardStyle} onClick={() => setActiveCard("track")}>
            <h4>📦 Track Booking</h4>
            <p>Check the status of your bookings.</p>
          </div>

          {/* Card 3 → Worker Search */}
          <div style={optionCardStyle} onClick={() => setActiveCard("workers")}>
            <h4>🔍 Worker Search</h4>
            <p>Find and hire workers quickly.</p>
          </div>
        </div>

        {/* Show content when a card is clicked */}
        <div style={{ marginTop: 25 }}>
          {activeCard === "track" && (
            <div>
              <h3>📦 Track Booking</h3>
              <TrackRequest />
            </div>
          )}
          {activeCard === "workers" && (
            <div>
              <h3>🔍 Worker Search</h3>
              <PersonList />
            </div>
          )}
        </div>

        {message && <p style={msgStyle}>{message}</p>}
      </div>
    );
  }

  // ---------------- Auth View ----------------
  return (
    <div className="customer-auth-card" style={cardStyle}>
      <div className="auth-toggle-buttons" style={{ marginBottom: 12 }}>
        <button
          onClick={() => setIsLogin(true)}
          disabled={isLogin}
          style={buttonStyle}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          disabled={!isLogin}
          style={{ ...buttonStyle, marginLeft: 8 }}
        >
          Create Account
        </button>
      </div>

      {isLogin ? (
        <form onSubmit={handleLogin}>
          <h2 style={titleStyle}>Customer Login</h2>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <h2 style={titleStyle}>Create Customer Account</h2>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            required
            style={inputStyle}
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            style={inputStyle}
          />
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            required
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      )}

      {message && <p style={msgStyle}>{message}</p>}
    </div>
  );
}

export default CustomerAuthCard;
