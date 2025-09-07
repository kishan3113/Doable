import React, { useState } from "react";
import axios from "axios";

const CreateCustomerAccountForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/api/customers", formData);
      alert("Account created successfully!");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to create account");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>Create Customer Account</h2>
      <input
        type="text"
        name="name"
        placeholder="Full Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email Address"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <button type="submit" className="btn">Create Account</button>
    </form>
  );
};

export default CreateCustomerAccountForm;
