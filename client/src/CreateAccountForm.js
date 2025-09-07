import React, { useState } from 'react';
import axios from 'axios';

function CreateCustomerAccountForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Simple frontend validation
      const { name, email, password, phone } = formData;
      if (!name || !email || !password || !phone) {
        alert('All fields are required.');
        return;
      }

      const response = await axios.post('http://localhost:3001/api/customers', formData);
      console.log(response.data);
      alert('Customer registered successfully!');
      setFormData({ name: '', email: '', password: '', phone: '' });
    } catch (err) {
      console.error('Error creating customer:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Failed to register customer.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Name"
        required
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
        required
      />
      <input
        type="text"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Phone"
        required
      />
      <button type="submit">Register</button>
    </form>
  );
}

export default CreateCustomerAccountForm;
