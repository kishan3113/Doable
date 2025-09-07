import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const WorkerRegister = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [pincode, setPincode] = useState("");
  const [profession, setProfession] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [photo, setPhoto] = useState(null); // ✅ New state for photo
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // ✅ Frontend validation
    if (pincode.length !== 6) {
      alert("❌ Pincode must be exactly 6 digits.");
      return;
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      alert("❌ Mobile number must be exactly 10 digits.");
      return;
    }
    if (password.length < 6) {
      alert("❌ Password must be at least 6 characters long.");
      return;
    }
    if (!profession) {
      alert("❌ Please select a profession.");
      return;
    }

    try {
      // ✅ Build FormData for file + fields
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("password", password.trim());
      formData.append("mobileNumber", mobileNumber.trim());
      formData.append("profession", profession);
      formData.append("area", "N/A"); // placeholder
      formData.append("city", "N/A"); // placeholder
      formData.append("pincode", pincode.trim());
      if (photo) formData.append("photo", photo); // ✅ attach photo

      const response = await axios.post("https://doable-ojum.onrender.com/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        alert("✅ Worker account created successfully!");
        navigate("/"); // back to login
      } else {
        alert(response.data.message || "❌ Registration failed.");
      }
    } catch (error) {
      console.error("Worker registration error:", error);
      alert(error.response?.data?.message || "❌ Registration failed. Please try again.");
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
          Worker Registration
        </h2>

        <form
          onSubmit={handleRegister}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <input
            type="text"
            placeholder="Enter Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Enter Pincode (6 digits)"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            required
          />

          {/* ✅ Profession Dropdown */}
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "1em",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="">-- Select Profession --</option>
            <option value="Plumber">Plumber</option>
            <option value="Electrician">Electrician</option>
            <option value="Carpenter">Carpenter</option>
            <option value="Painter">Painter</option>
            <option value="Mechanic">Mechanic</option>
            <option value="Cleaner">Cleaner</option>
            <option value="Gardener">Gardener</option>
          </select>

          <input
            type="text"
            placeholder="Enter Mobile Number (10 digits)"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
          />

          {/* ✅ File input for photo */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
          />

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

export default WorkerRegister;
