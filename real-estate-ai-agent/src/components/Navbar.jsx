import React, { useState } from 'react';
import './Navbar.css';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    // In a real app, this would open a login modal or redirect to login page
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">RealEstateAI</div>
      <div className="navbar-menu">
        <button className="login-button" onClick={handleLogin}>
          {isLoggedIn ? 'Logout' : 'Login'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;