import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CustomerLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://doable-ojum.onrender.com', { email, password });
      alert('Login successful!');
      onLogin(res.data.name, res.data._id);
      navigate('/customer-dashboard'); // Redirect to customer dashboard
    } catch (err) {
      console.error(err);
      alert('Invalid email or password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>Customer Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className="btn">Login</button>
    </form>
  );
};

export default CustomerLogin;
