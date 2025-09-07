import React from "react";
import "./BookingStatus.css";

const steps = ["pending", "confirmed", "completed"];

const BookingStatusLine = ({ status }) => {
  return (
    <div>
      <div className="status-line">
        {steps.map((step, idx) => {
          let className = "status-step";
          if (status === step) className += " active";
          if (steps.indexOf(status) > idx) className += " completed";
          if (status === "cancelled") className += " cancelled";

          return (
            <div key={step} className={className}>
              {idx + 1}
            </div>
          );
        })}
      </div>
      <div className="status-labels">
        {steps.map((s) => (
          <span key={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
        ))}
      </div>
      {status === "cancelled" && (
        <p style={{ color: "#e74c3c", marginTop: "8px" }}>
          Booking Cancelled ❌
        </p>
      )}
    </div>
  );
};

export default BookingStatusLine;
