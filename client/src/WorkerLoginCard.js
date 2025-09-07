// src/WorkerLoginCard.js

import React, { useState } from 'react';

const WorkerLoginCard = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // This is where you would handle the login logic
    console.log('Logging in with:', { name, password });
    alert('Login functionality will be added here.');
  };

  return (
    <div className="login-container">
      <h2>Worker Login</h2>
      <form onSubmit={handleSubmit}>
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
    </div>
  );
};

export default WorkerLoginCard;
