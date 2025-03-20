import React from 'react';
import './PlaceCards.css';

function PlaceCards({ places, loading }) {
  console.log("Places in PlaceCards:", places);
  console.log("Loading state:", loading);
  
  if (loading) {
    return (
      <div className="place-cards-container">
        <div className="loading-indicator">Loading information...</div>
      </div>
    );
  }

  if (!places || places.length === 0) {
    return (
      <div className="place-cards-container">
        <div className="no-data-message">
          Search for a location to see nearby places
        </div>
      </div>
    );
  }

  return (
    <div className="place-cards-container">
      <h2>Nearby Places</h2>
      <div className="cards-grid">
        {places.map((place, index) => (
          <div className="place-card" key={index}>
            <div className="place-card-header">
              <h3>{place.name}</h3>
              <span className="place-type">{place.type}</span>
            </div>
            <div className="place-card-body">
              <p>{place.address}</p>
              {place.rating && (
                <p className="place-rating">
                  Rating: {place.rating} ⭐ ({place.user_ratings_total} reviews)
                </p>
              )}
              <div className="place-distance">
                <span>{place.distance} miles away</span>
              </div>
            </div>
            <div className="place-card-footer">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="map-link"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlaceCards;