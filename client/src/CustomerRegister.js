import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CustomerRegister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // Gmail
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(""); // ✅ matches backend
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // ✅ Frontend validation
    if (!/^\d{10}$/.test(phone)) {
      alert("❌ Mobile number must be exactly 10 digits.");
      return;
    }
    if (password.length < 6) {
      alert("❌ Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await axios.post("https://doable-ojum.onrender.com/api/customers", {
        name,
        email,
        password,
        phone,   // ✅ backend expects "phone"
        address, // ✅ added
      });

      if (res.data.success) {
        alert("✅ Customer account created successfully!");
        navigate("/"); // back to login page
      } else {
        alert(res.data.message || "❌ Registration failed.");
      }
    } catch (err) {
      console.error("Customer registration error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "❌ Registration failed. Try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #2c3e50, #3498db)",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#2c3e50" }}>
          Customer Registration
        </h2>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Mobile Number (10 digits)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <textarea
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
          ></textarea>

          <button
            type="submit"
            style={{
              padding: "12px",
              background: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Register
          </button>
        </form>

        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Already have an account?{" "}
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              color: "#3498db",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default CustomerRegister;
