import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './login.css';
import { API_ENDPOINTS, STORAGE_KEYS } from '../../config';
import { useAuth } from '../../App';

// Use local images that will work in Docker + online fallbacks
const sliderImages = [
  '/images/backgrounds/bg1.jpg',
  '/images/backgrounds/bg2.jpg', 
  '/images/backgrounds/bg3.jpg',
  '/images/backgrounds/bg4.jpg',
];

// Online fallbacks if local images don't exist
const onlineFallbacks = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80',
];

// Beautiful gradient fallbacks as final backup
const fallbackBackgrounds = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // Enhanced image loading with multiple fallback levels
  useEffect(() => {
    const preloadImages = () => {
      sliderImages.forEach((src, index) => {
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Local image ${index + 1} loaded successfully: ${src}`);
          setImageLoaded(prev => ({ ...prev, [index]: src }));
        };
        img.onerror = () => {
          console.warn(`❌ Local image ${index + 1} failed, trying online fallback...`);
          // Try online fallback
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            console.log(`✅ Online fallback ${index + 1} loaded successfully`);
            setImageLoaded(prev => ({ ...prev, [index]: onlineFallbacks[index] }));
          };
          fallbackImg.onerror = () => {
            console.warn(`❌ All images failed for ${index + 1}, using gradient`);
            setImageLoaded(prev => ({ ...prev, [index]: false }));
          };
          fallbackImg.src = onlineFallbacks[index];
        };
        img.src = src;
      });
    };
    preloadImages();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // The server returns user data directly, not nested in a user object
      // Save user data using the auth context
      login(data);
      
      // Clear form
      setEmail('');
      setPassword('');
      
      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: `Welcome back, ${data.name}!`,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      
      // Navigate to dashboard (will happen automatically due to auth state change)
      navigate('/', { replace: true });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.message || 'Invalid email or password. Please try again.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="overlay" />
      {sliderImages.map((img, idx) => {
        const isActive = idx === bgIndex;
        const loadedImage = imageLoaded[idx];
        
        let backgroundStyle;
        if (loadedImage && loadedImage !== false) {
          // Use the successfully loaded image (local or online fallback)
          backgroundStyle = { backgroundImage: `url(${loadedImage})` };
        } else {
          // Use gradient fallback
          backgroundStyle = { background: fallbackBackgrounds[idx] };
        }
        
        return (
          <div
            key={`login-slide-${idx}`}
            className={`bg-slide ${isActive ? 'active' : ''}`}
            style={{ 
              ...backgroundStyle, 
              zIndex: isActive ? 1 : 0 
            }}
          />
        );
      })}
      <div className="login-container">
        <h2 className="login-title">Welcome Back!</h2>
        <form className="login-form" onSubmit={handleLogin}>
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
                placeholder="Enter your password"
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          <button 
            className="login-btn" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          <div className="login-footer">
            <span>Don't have an account?</span>
            <a href="/signup">Sign Up</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
