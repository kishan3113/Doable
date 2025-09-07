// src/TrackRequest.js

import React, { useState } from 'react';
import axios from 'axios';

const TrackRequest = () => {
  const [trackingId, setTrackingId] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBookingStatus(null);
    setErrorMessage('');

    if (trackingId.trim() === '') {
      setErrorMessage('Please enter a tracking ID.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3001/api/bookings/track/${trackingId}`);
      if (response.data.success) {
        setBookingStatus(response.data.booking.status);
      } else {
        setErrorMessage('Invalid tracking ID.');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      setErrorMessage('Could not find a booking with that ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="track-request-container">
      <h2>Track Your Booking Request</h2>
      <form onSubmit={handleTrackSubmit} className="track-form">
        <input
          type="text"
          placeholder="Enter Tracking ID"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          required
        />
        <button type="submit">Track</button>
      </form>

      {loading && <p>Tracking your request...</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {bookingStatus && (
        <div className="status-card">
          <h4>Status:</h4>
          <p className={`status-text ${bookingStatus}`}>
            {bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackRequest;