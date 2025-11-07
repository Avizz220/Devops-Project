import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/login';
import Signup from './components/Signup/signup';
import Home from './components/Home/home';
import Dashboard from './components/Dashboard/dashboard';
import { STORAGE_KEYS } from './config';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    setIsLoggedIn(!!user);
  }, []);
  
  return (
    <Router>
      <Routes>
  <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login />} />
  <Route path="/signup" element={isLoggedIn ? <Navigate to="/" replace /> : <Signup />} />
  {/* Root goes to Dashboard for logged-in users */}
  <Route path="/" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />} />
  <Route path="/home" element={isLoggedIn ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
};

export default App;
