import React from 'react';
import { Link } from 'react-router-dom';

const WorkerAuthCard = () => {
  return (
    <div className="worker-auth-card">
      <h2>Worker Portal</h2>
      <p>Please select an option to continue.</p>
      <div className="auth-options">
        <Link to="/login" className="auth-btn login-btn">Login</Link>
        <Link to="/create-account" className="auth-btn create-btn">Create Account</Link>
      </div>
    </div>
  );
};

export default WorkerAuthCard;