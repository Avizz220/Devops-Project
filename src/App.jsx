// Test: Automated deployment pipeline - Jan 30, 2026
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/login';
import Signup from './components/Signup/signup';
import Home from './components/Home/home';
import Dashboard from './components/Dashboard/dashboard';
import LandingPage from './components/Landing/landing';
import { STORAGE_KEYS } from './config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {

    try {
      const userString = localStorage.getItem(STORAGE_KEYS.USER);
      console.log('Checking user login status:', userString ? 'Logged in' : 'Not logged in');
      
      if (userString) {

        try {
          const user = JSON.parse(userString);
          if (user && user.id && user.email) {
            console.log('Valid user found:', user.email);
            setIsLoggedIn(true);
          } else {
            console.log('Invalid user data, clearing localStorage');
            localStorage.removeItem(STORAGE_KEYS.USER);
            setIsLoggedIn(false);
          }
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          localStorage.removeItem(STORAGE_KEYS.USER);
          setIsLoggedIn(false);
        }
      } else {
        console.log('No user data found in localStorage');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    setIsLoggedIn(true);
  };

  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem(STORAGE_KEYS.USER);
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '20px'
      }}>
        Loading...
      </div>
    );
  }

  console.log('Rendering App - isLoggedIn:', isLoggedIn, 'loading:', loading);
  
  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      <Router>
        <Routes>
          {/* Landing page for non-authenticated users */}
          <Route 
            path="/" 
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage />
              )
            } 
          />
          <Route 
            path="/login" 
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            } 
          />
          <Route 
            path="/signup" 
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Signup />
              )
            } 
          />
          {/* Dashboard for logged-in users */}
          <Route 
            path="/dashboard" 
            element={
              isLoggedIn ? (
                <Dashboard />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/home" 
            element={
              isLoggedIn ? (
                <Home />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/"} replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
