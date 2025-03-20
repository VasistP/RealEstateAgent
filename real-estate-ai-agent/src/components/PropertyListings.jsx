import React from 'react';
import './PropertyListings.css';

function PropertyListings({ properties, loading }) {
  if (loading) {
    return (
      <div className="property-listings-container">
        <div className="loading-indicator">Loading properties...</div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="property-listings-container">
        <div className="no-data-message">
          No properties found. Try searching for a different location.
        </div>
      </div>
    );
  }

  return (
    <div className="property-listings-container">
      <h2>Available Properties</h2>
      <div className="property-filters">
        <button className="filter-button active">All</button>
        <button className="filter-button">For Rent</button>
        <button className="filter-button">For Sale</button>
        <button className="filter-button">For Lease</button>
      </div>
      <div className="properties-grid">
        {properties.map((property, index) => (
          <div className="property-card" key={index}>
            <div className="property-image">
              {/* Placeholder image */}
              <div className="placeholder-image">
                {property.type} Image
              </div>
              <span className="property-badge">{property.listingType}</span>
            </div>
            <div className="property-card-body">
              <h3>{property.name}</h3>
              <p className="property-address">{property.address}</p>
              <div className="property-details">
                <span><strong>{property.beds}</strong> Beds</span>
                <span><strong>{property.baths}</strong> Baths</span>
                <span><strong>{property.sqft}</strong> sqft</span>
              </div>
              <div className="property-price">
                {property.currency} {property.price.toLocaleString()}
              </div>
              <div className="property-distance">
                <span>{property.distance} miles from center</span>
              </div>
            </div>
            <div className="property-card-footer">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="map-link"
              >
                View on Map
              </a>
              <button className="contact-button">Contact Agent</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PropertyListings;