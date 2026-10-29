// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./website.css";
import Landing from "./Landing";
import PublicServices from "./PublicServices";
import Login from "./Login";
import WorkerDashboard from "./WorkerDashboard"; // ✅ capital W to match file name
import CustomerDashboard from "./CustomerDashboard";
import WorkerRegister from "./WorkerRegister"; // ✅ worker registration page
import CustomerRegister from "./CustomerRegister"; // ✅ customer registration page

const App = () => {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/services" element={<PublicServices />} />

      {/* Registration Routes */}
      <Route path="/register-worker" element={<WorkerRegister />} />
      <Route path="/register-customer" element={<CustomerRegister />} />

      {/* Dashboards */}
      <Route path="/worker-dashboard" element={<WorkerDashboard />} />
      <Route path="/customer-dashboard" element={<CustomerDashboard />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
