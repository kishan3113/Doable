// src/WorkerProfile.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const WorkerProfile = () => {
  const [viewMode, setViewMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        name,
        password
      });
      alert(response.data.message);
      if (response.data.success) {
        navigate('/list'); 
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        name,
        password,
        mobileNumber
      });
      alert(response.data.message);
      if (response.data.success) {
        setViewMode('login'); // Switch to login view after successful registration
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="worker-profile-card">
      <h2>{viewMode === 'login' ? 'Worker Login' : 'Create Account'}</h2>
      {viewMode === 'login' ? (
        <form onSubmit={handleLoginSubmit}>
          <input 
            type="text" 
            placeholder="Worker Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit}>
          <input 
            type="text" 
            placeholder="Choose a Worker Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <input 
            type="tel" 
            placeholder="Mobile Number (+91...)" 
            value={mobileNumber} 
            onChange={(e) => setMobileNumber(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Create a Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Register</button>
        </form>
      )}
      <p className="switch-link">
        {viewMode === 'login' ? (
          <>
            Don't have an account? <span onClick={() => setViewMode('register')}>Register here.</span>
          </>
        ) : (
          <>
            Already have an account? <span onClick={() => setViewMode('login')}>Login here.</span>
          </>
        )}
      </p>
    </div>
  );
};

export default WorkerProfile;