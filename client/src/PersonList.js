import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const professions = ['carpenter', 'milkman', 'mistri', 'plumber', 'other'];
const professionImageUrls = {
  carpenter: 'https://placehold.co/60x60/5a7d9a/ffffff?text=C',
  milkman: 'https://placehold.co/60x60/5a7d9a/ffffff?text=M',
  mistri: 'https://placehold.co/60x60/5a7d9a/ffffff?text=Mi',
  plumber: 'https://placehold.co/60x60/5a7d9a/ffffff?text=P',
  other: 'https://placehold.co/60x60/5a7d9a/ffffff?text=O'
};

const PersonList = () => {
  const [persons, setPersons] = useState([]);
  const [pincodeTerm, setPincodeTerm] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [showProfessions, setShowProfessions] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const fetchPersons = async () => {
    try {
      const response = await axios.get('https://doable-ojum.onrender.com/api/auth/all-workers');
      setPersons(response.data.workers);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await axios.delete(`https://doable-ojum.onrender.com/api/auth/all-workers/${id}`);
        alert('Profile deleted successfully!');
        fetchPersons();
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Error deleting profile.');
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

  const handlePincodeSearch = (e) => {
    if (e.key === 'Enter') {
      if (pincodeTerm.trim() !== '' && pincodeTerm.length === 5) {
        setShowProfessions(true);
        setSelectedProfession('');
        setShowResults(false);
      } else {
        setShowProfessions(false);
        setSelectedProfession('');
        setShowResults(false);
        if (pincodeTerm.length !== 5) {
          alert('Pincode must be exactly 5 digits.');
        }
      }
    }
  };

  const handleProfessionSelection = (prof) => {
    setSelectedProfession(prof);
    setShowResults(true);
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const filteredAndSortedPersons = persons
    .filter(person => {
      if (!pincodeTerm || !selectedProfession) {
        return false;
      }
      
      const matchesPincode = person.pincode === pincodeTerm;
      const matchesProfession = person.profession === selectedProfession;

      return matchesPincode && matchesProfession;
    })
    .sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

  return (
    <div className="person-list-container">
      <h2>Registered Persons</h2>
      <div className="filter-options">
        <div className="search-bar">
          <input
            type="number"
            placeholder="Enter Pincode and press Enter..."
            value={pincodeTerm}
            onChange={(e) => setPincodeTerm(e.target.value)}
            onKeyDown={handlePincodeSearch}
          />
        </div>
        {showProfessions && !showResults && (
          <div className="profession-selection-container">
            <h3>Select a Profession:</h3>
            <div className="profession-selection">
              {professions.map(prof => (
                <div
                  key={prof}
                  className={`profession-box ${selectedProfession === prof ? 'active' : ''}`}
                  onClick={() => handleProfessionSelection(prof)}
                >
                  <img
                    src={professionImageUrls[prof]}
                    alt={`${prof} icon`}
                    className="profession-icon"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showResults && (
        <div className="person-list">
          {filteredAndSortedPersons.length > 0 ? (
            filteredAndSortedPersons.map(person => (
              <Link to={`/book-worker/${person._id}`} key={person._id}>
                <div className="person-card">
                  {person.photo && (
                    <img
                      src={`https://doable-ojum.onrender.com${person.photo}`}
                      alt={person.name}
                      className="person-photo"
                    />
                  )}
                  <div className="card-content">
                    <h3>{person.name}</h3>
                    <p><strong>Profession:</strong> {person.profession}</p>
                    <p><strong>Area:</strong> {person.area}</p>
                    <p><strong>City:</strong> {person.city}</p>
                    <p><strong>Mobile:</strong> {person.mobileNumber}</p>
                    <div className="card-actions">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleWhatsAppChat(person.mobileNumber); }}
                        className="whatsapp-btn"
                      >
                        WhatsApp Chat
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleDelete(person._id); }}
                        className="delete-btn"
                      >
                        Delete Profile
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="no-data-message">No matching persons found.</p>
          )}
        </div>
      )}

      {!showProfessions && !showResults && (
        <p className="no-data-message">
          Please enter an area and select a profession to search.
        </p>
      )}
    </div>
  );
};

export default PersonList;