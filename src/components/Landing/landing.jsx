import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  console.log('LandingPage component rendered');

  const slides = [
    {
      title: "One Stop Event Planner",
      subtitle: "EVERY EVENT SHOULD BE PERFECT",
      description: "Transform your vision into unforgettable experiences",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1920&q=80"
    },
    {
      title: "Create Memorable Moments",
      subtitle: "WHERE DREAMS COME TO LIFE",
      description: "Professional event management at your fingertips",
      image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1920&q=80"
    },
    {
      title: "Connect & Celebrate",
      subtitle: "BRINGING PEOPLE TOGETHER",
      description: "Discover and join amazing events in your community",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80"
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">🎤</span>
            <span className="logo-text">
              <span className="logo-main">HARMONI</span>
              <span className="logo-sub">EVENT MANAGEMENT</span>
            </span>
          </div>
          <div className="nav-links">
            <button onClick={() => navigate('/login')} className="nav-btn login-btn">
              <span className="btn-icon">👤</span>
              Login
            </button>
            <button onClick={() => navigate('/signup')} className="nav-btn signup-btn">
              <span className="btn-icon">✨</span>
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Slider */}
      <section className="hero-section">
        <div className="hero-slider">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="slide-overlay"></div>
              <div className="slide-content">
                <h2 className="slide-subtitle animate-fade-in">{slide.subtitle}</h2>
                <h1 className="slide-title animate-slide-up">{slide.title}</h1>
                <p className="slide-description animate-fade-in-delay">{slide.description}</p>
                <div className="hero-buttons animate-fade-in-delay-2">
                  <button onClick={() => navigate('/signup')} className="hero-btn primary">
                    GET STARTED!
                  </button>
                  <button onClick={() => navigate('/login')} className="hero-btn secondary">
                    ABOUT US
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slider Controls */}
        <button className="slider-control prev" onClick={handlePrevSlide}>
          ‹
        </button>
        <button className="slider-control next" onClick={handleNextSlide}>
          ›
        </button>

        {/* Slider Indicators */}
        <div className="slider-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => handleSlideChange(index)}
            >
              {String(index + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Perfect Planning</h3>
              <p>Professional tools to organize every detail of your event</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Community Driven</h3>
              <p>Connect with attendees and build lasting relationships</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-time Analytics</h3>
              <p>Track event performance with comprehensive insights</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎫</div>
              <h3>Easy Ticketing</h3>
              <p>Seamless ticket management and payment processing</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Smart Notifications</h3>
              <p>Keep everyone updated with automated reminders</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌟</div>
              <h3>Premium Experience</h3>
              <p>Deliver unforgettable experiences to your audience</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Create Amazing Events?</h2>
          <p>Join thousands of event organizers who trust our platform</p>
          <button onClick={() => navigate('/signup')} className="cta-btn">
            Start Your Journey Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-icon">🎤</span>
            <span className="footer-brand">HARMONI</span>
          </div>
          <p>© 2025 Harmoni Event Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
