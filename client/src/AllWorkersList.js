// src/AllWorkersList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AllWorkersList = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    try {
      const response = await axios.get('https://doable-ojum.onrender.com/api/auth/all-workers');
      setWorkers(response.data.workers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setLoading(false);
      alert('Could not fetch worker list.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker profile? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:3001/api/auth/all-workers/${id}`);
        alert('Worker profile deleted successfully!');
        fetchWorkers();
      } catch (error) {
        console.error('Error deleting worker:', error);
        alert('Error deleting worker profile.');
      }
    }
  };

  const handleWhatsAppChat = (mobileNumber) => {
    if (mobileNumber) {
      const url = `https://wa.me/${mobileNumber}`;
      window.open(url, '_blank');
    } else {
      alert('Mobile number not available for this person.');
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  if (loading) {
    return <div>Loading all worker profiles...</div>;
  }

  return (
    <div className="all-workers-container">
      <h2>All Registered Workers</h2>
      <div className="person-list">
        {workers.length > 0 ? (
          workers.map(worker => (
            <div key={worker._id} className="person-card">
              {worker.photo && (
                <img
                  src={`http://localhost:3001${worker.photo}`}
                  alt={worker.name}
                  className="person-photo"
                />
              )}
              <div className="card-content">
                <h3>{worker.name}</h3>
                <p><strong>Profession:</strong> {worker.profession}</p>
                <p><strong>Mobile:</strong> {worker.mobileNumber}</p>
                <div className="card-actions">
                  <button
                    onClick={() => handleWhatsAppChat(worker.mobileNumber)}
                    className="whatsapp-btn"
                  >
                    WhatsApp Chat
                  </button>
                  <button
                    onClick={() => handleDelete(worker._id)}
                    className="delete-btn"
                  >
                    Delete Worker
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data-message">No workers have registered yet.</p>
        )}
      </div>
    </div>
  );
};

export default AllWorkersList;
