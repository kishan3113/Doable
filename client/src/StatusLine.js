// src/components/StatusLine.js
import React from "react";
import "./CustomerDashboard.css"; // or a dedicated StatusLine.css

const steps = ["pending", "confirmed", "completed", "cancelled"];

const StatusLine = ({ status }) => {
  const currentIndex = steps.indexOf(status?.toLowerCase());

  return (
    <div className="status-line">
      {steps.slice(0, 3).map((step, idx) => (
        <div
          key={step}
          className={`status-step ${
            idx < currentIndex ? "completed" : idx === currentIndex ? "active" : ""
          }`}
        >
          <div className="status-circle"></div>
          <span style={{ textTransform: "capitalize" }}>{step}</span>
        </div>
      ))}
    </div>
  );
};

export default StatusLine;
