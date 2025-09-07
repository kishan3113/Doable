// src/WorkerDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const WorkerDashboard = ({ workerName, workerId }) => {
  const [workerData, setWorkerData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchWorkerDetails = useCallback(async () => {
    if (workerId) {
      try {
        const profileResponse = await axios.get(`http://localhost:3001/api/auth/profile/${workerId}`);
        const bookingsResponse = await axios.get(`http://localhost:3001/api/bookings/worker/${workerId}`);

        if (profileResponse.data.success && bookingsResponse.data.success) {
          setWorkerData(profileResponse.data.worker);
          setBookings(bookingsResponse.data.bookings);
          setErrorMessage('');
        } else {
          setWorkerData(null);
          setBookings([]);
          setErrorMessage('Worker data or bookings not found.');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setWorkerData(null);
        setBookings([]);
        setErrorMessage('Could not load worker profile or bookings.');
      } finally {
        setLoading(false);
      }
    }
  }, [workerId]);

  const handleAcceptBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to accept this booking?')) {
      try {
        await axios.put(`http://localhost:3001/api/bookings/${bookingId}/accept`);
        alert('Booking accepted successfully!');
        fetchWorkerDetails(); // Refresh the list
      } catch (error) {
        console.error('Error accepting booking:', error);
        alert('Failed to accept booking request.');
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking request?')) {
      try {
        await axios.delete(`http://localhost:3001/api/bookings/${bookingId}`);
        alert('Booking request deleted successfully!');
        fetchWorkerDetails(); // Refresh the list
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Failed to delete booking request.');
      }
    }
  };

  useEffect(() => {
    fetchWorkerDetails();
  }, [fetchWorkerDetails]);

  if (loading) {
    return <div>Loading your profile...</div>;
  }

  if (errorMessage) {
    return <p className="error-message">{errorMessage}</p>;
  }
  
  if (!workerData) {
    return <div>Profile data not found.</div>;
  }

  return (
    <div className="worker-dashboard-container">
      <h2>Welcome, {workerData.name}</h2>
      
      {/* Profile Card */}
      <div className="worker-profile-card">
        {workerData.photo && (
          <img
            src={`http://localhost:3001${workerData.photo}`}
            alt={workerData.name}
            className="person-photo-large"
          />
        )}
        <div className="card-content">
          <h3>Your Profile Details</h3>
          <p><strong>Profession:</strong> {workerData.profession}</p>
          <p><strong>Area:</strong> {workerData.area}</p>
          <p><strong>City:</strong> {workerData.city}</p>
          <p><strong>Mobile:</strong> {workerData.mobileNumber}</p>
          <p><strong>Pincode:</strong> {workerData.pincode}</p>
        </div>
      </div>
      
      {/* Bookings Card */}
      <div className="bookings-card">
        <h3>Your Bookings</h3>
        {bookings.length > 0 ? (
          bookings.map(booking => (
            <div key={booking._id} className="booking-item">
              <p><strong>Client:</strong> {booking.clientName}</p>
              <p><strong>Job:</strong> {booking.jobDetails}</p>
              <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
              <div className="booking-actions">
                <button
                  onClick={() => handleAcceptBooking(booking._id)}
                  className="accept-btn"
                  disabled={booking.status !== 'pending'}
                >
                  {booking.status === 'accepted' ? 'Accepted' : 'Accept'}
                </button>
                <button
                  onClick={() => handleDeleteBooking(booking._id)}
                  className="delete-booking-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data-message">You have no new bookings.</p>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;