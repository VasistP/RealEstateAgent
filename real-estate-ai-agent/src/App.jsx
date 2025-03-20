import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ChatWindow from './components/ChatWindow';
import PlaceCards from './components/PlaceCards';
import PropertyListings from './components/PropertyListings';
import './App.css';

function App() {
  const [places, setPlaces] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('places'); // 'places' or 'properties'

  const handleChatResponse = (responseData) => {
    console.log("Response data in App:", responseData);
    
    // Handle places data
    if (responseData.places && responseData.places.length > 0) {
      console.log("Setting places:", responseData.places);
      setPlaces(responseData.places);
      setActiveTab('places');
    }
    
    // Check if this is a property search request
    if (responseData.message && responseData.message.toLowerCase().includes('properties')) {
      setActiveTab('properties');
      fetchProperties(responseData.location || '');
    }
  };
  
  const fetchProperties = async (location) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location, type: 'all' }),
      });
      
      const data = await response.json();
      console.log("Properties data:", data);
      
      if (data.properties && data.properties.length > 0) {
        setProperties(data.properties);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="main-content">
        <ChatWindow onResponse={handleChatResponse} setLoading={setLoading} />
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'places' ? 'active' : ''}`}
              onClick={() => setActiveTab('places')}
            >
              Nearby Places
            </button>
            <button 
              className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
              onClick={() => setActiveTab('properties')}
            >
              Properties
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'places' ? (
              <PlaceCards places={places} loading={loading} />
            ) : (
              <PropertyListings properties={properties} loading={loading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;