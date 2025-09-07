// src/Register.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        name,
        password
      });

      if (response.data.success) {
        alert('Registration successful! You can now log in.');
        navigate('/login');
      } else {
        alert('Registration failed. Please try a different name.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <h2>Register New Worker</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Choose a Worker Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
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
    </div>
  );
};

export default Register;