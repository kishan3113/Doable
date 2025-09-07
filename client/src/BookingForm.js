// src/BookingForm.js

import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const BookingForm = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    jobDetails: '',
    bookingDate: ''
  });
  const { id } = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://doable-ojum.onrender.com/api/bookings', {
        workerId: id,
        clientName: formData.clientName,
        jobDetails: formData.jobDetails,
        bookingDate: formData.bookingDate
      });
      alert(`Booking request sent successfully!\nYour tracking ID is: ${response.data.trackingId}`);
      navigate('/list');
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    }
  };

  return (
    <div className="form-container">
      <h2>Book a Worker</h2>
      <p>Fill out the details to book a job with this worker.</p>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="clientName" 
          value={formData.clientName} 
          onChange={handleChange} 
          placeholder="Your Name" 
          required 
        />
        <textarea 
          name="jobDetails" 
          value={formData.jobDetails} 
          onChange={handleChange} 
          placeholder="Describe the job you need done..." 
          required 
        />
        <input 
          type="date" 
          name="bookingDate" 
          value={formData.bookingDate} 
          onChange={handleChange} 
          required 
        />
        <button type="submit">Send Booking Request</button>
      </form>
    </div>
  );
};

export default BookingForm;