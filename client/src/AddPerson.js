// src/AddPerson.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const professions = ['carpenter', 'milkman', 'mistri', 'plumber', 'other'];

const AddPerson = () => {
  const [formData, setFormData] = useState({
    accountId: '',
    password: '',
    name: '', // Added name field
    profession: '',
    area: '',
    city: '',
    mobileNumber: ''
  });
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    if (photo) {
      data.append('photo', photo);
    }

    try {
      await axios.post('https://doable-ojum.onrender.com/persons', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Person added successfully!');
      navigate('/list');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error adding person.');
    }
  };

  return (
    <div className="add-person-container">
      <h2>Create New Account</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="accountId" value={formData.accountId} onChange={handleChange} placeholder="Account ID" required />
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Worker's Full Name" required />
        <select name="profession" value={formData.profession} onChange={handleChange} required>
          <option value="">Select Profession</option>
          {professions.map(prof => (
            <option key={prof} value={prof}>{prof.charAt(0).toUpperCase() + prof.slice(1)}</option>
          ))}
        </select>
        <input type="text" name="area" value={formData.area} onChange={handleChange} placeholder="Area" />
        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
        <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="Mobile Number (+91...)" required />
        <label>Photo: </label>
        <input type="file" name="photo" onChange={handleFileChange} />
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
};

export default AddPerson;
