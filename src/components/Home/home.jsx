import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../../config';
import './home.css';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useEffect(() => {

    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error('Error parsing user data:', e);
      localStorage.removeItem(STORAGE_KEYS.USER);
      navigate('/login');
    }
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    navigate('/login');
  };
  
  if (!user) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="home-container">
      <div className="welcome-banner">
        <h1>Welcome, {user.name}!</h1>
        <p>You have successfully logged in to the Community Events platform.</p>
      </div>
      
      <div className="user-info">
        <h2>Your Account</h2>
        <div className="info-card">
          <div className="info-row">
            <span>Name:</span>
            <span>{user.name}</span>
          </div>
          <div className="info-row">
            <span>Email:</span>
            <span>{user.email}</span>
          </div>
          <div className="info-row">
            <span>Role:</span>
            <span>{user.role}</span>
          </div>
        </div>
      </div>
      
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Home;
