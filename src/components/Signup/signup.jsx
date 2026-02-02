import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './signup.css';
import { API_ENDPOINTS } from '../../config';

const sliderImages = [
  '/images/backgrounds/bg2.jpg',
  '/images/backgrounds/bg4.jpg',
  '/images/backgrounds/bg1.jpg', 
  '/images/backgrounds/bg3.jpg',
];

const onlineFallbacks = [
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1920&q=80',
];

const fallbackBackgrounds = [
  'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
  'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
  'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
  'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
];

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant');
  const [showPassword, setShowPassword] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({});
  const [useGradients, setUseGradients] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const preloadImages = () => {
      sliderImages.forEach((src, index) => {
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Signup local image ${index + 1} loaded: ${src}`);
          setImageLoaded(prev => ({ ...prev, [index]: src }));
        };
        img.onerror = () => {
          console.warn(`❌ Signup local image ${index + 1} failed, trying online...`);

          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            console.log(`✅ Signup online fallback ${index + 1} loaded`);
            setImageLoaded(prev => ({ ...prev, [index]: onlineFallbacks[index] }));
          };
          fallbackImg.onerror = () => {
            console.warn(`❌ All signup images failed for ${index + 1}, using gradient`);
            setImageLoaded(prev => ({ ...prev, [index]: false }));
          };
          fallbackImg.src = onlineFallbacks[index];
        };
        img.src = src;
      });
    };
    preloadImages();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.SIGNUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setName('');
      setEmail('');
      setPassword('');

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Account created successfully!',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Go to Login'
      });

      navigate('/login');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.message || 'Error creating account. Please try again.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-bg">
      <div className="overlay" />
      {sliderImages.map((img, idx) => {
        const isActive = idx === bgIndex;
        const loadedImage = imageLoaded[idx];
        
        let backgroundStyle;
        if (loadedImage && loadedImage !== false) {

          backgroundStyle = { backgroundImage: `url(${loadedImage})` };
        } else {

          backgroundStyle = { background: fallbackBackgrounds[idx] };
        }
        
        return (
          <div
            key={`signup-slide-${idx}`}
            className={`bg-slide ${isActive ? 'active' : ''}`}
            style={{ 
              ...backgroundStyle, 
              zIndex: isActive ? 1 : 0 
            }}
          />
        );
      })}
      <div className="signup-container">
        <h2 className="signup-title">Create Your Account</h2>
        <form className="signup-form" onSubmit={handleSignup}>
          <div className="input-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Enter your name"
            />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Create a password"
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? ' 🙈' : '👁️'}
              </span>
            </div>
          </div>
          <div className="input-group">
            <label>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="participant">Participant</option>
              <option value="organizer">Organizer</option>
              <option value="both">Both (Organizer & Participant)</option>
            </select>
          </div>
          <button 
            className="signup-btn" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
          <div className="signup-footer">
            <span>Already have an account?</span>
            <a href="/login">Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
