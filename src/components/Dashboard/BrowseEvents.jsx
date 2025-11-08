import React, { useState } from 'react';
import './BrowseEvents.css';

const BrowseEvents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const events = [
    {
      id: 1,
      title: 'Summer Music Festival',
      category: 'music',
      price: 149,
      rating: 4.9,
      description: 'Three days of amazing music with top artists from around the world.',
      date: 'Jul 20, 2025 at 18:00',
      location: 'Golden Gate Park',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      title: 'Jazz Night at Blue Note',
      category: 'music',
      price: 75,
      rating: 4.8,
      description: 'An intimate evening with world-class jazz musicians.',
      date: 'Sep 25, 2025 at 20:00',
      location: 'Blue Note Jazz Club',
      image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      title: 'Food & Wine Festival',
      category: 'food',
      price: 89,
      rating: 4.7,
      description: 'Taste exquisite dishes and wines from renowned chefs and wineries.',
      date: 'Oct 15, 2025 at 12:00',
      location: 'Waterfront Plaza',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      title: 'Tech Innovation Summit 2025',
      category: 'tech',
      price: 299,
      rating: 4.9,
      description: 'The biggest tech conference of the year with industry leaders.',
      date: 'Oct 15, 2025 at 09:00',
      location: 'San Francisco Convention Center',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      title: 'Modern Art Exhibition',
      category: 'art',
      price: 45,
      rating: 4.6,
      description: 'Contemporary art from emerging and established artists.',
      date: 'Nov 5, 2025 at 10:00',
      location: 'Museum of Modern Art',
      image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop'
    },
    {
      id: 6,
      title: 'Marathon Run 2025',
      category: 'sports',
      price: 65,
      rating: 4.5,
      description: 'Annual city marathon with routes for all skill levels.',
      date: 'Nov 20, 2025 at 07:00',
      location: 'City Center',
      image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=400&h=300&fit=crop'
    }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || event.category === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="browse-events-container">
      <header className="browse-header">
        <div>
          <h1 className="browse-title">Browse Events</h1>
          <p className="browse-subtitle">Discover and manage all your events</p>
        </div>
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            ▦
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            ☰
          </button>
        </div>
      </header>

      <div className="filters-section">
        <div className="filters-header">
          <span className="filter-icon">⚙️</span>
          <span className="filters-title">Filters & Search</span>
        </div>
        
        <div className="filters-row">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option>All Categories</option>
            <option>Music</option>
            <option>Tech</option>
            <option>Art</option>
            <option>Food</option>
            <option>Sports</option>
          </select>

          <select 
            className="filter-select"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option>All Locations</option>
            <option>San Francisco</option>
            <option>New York</option>
            <option>Los Angeles</option>
          </select>

          <select className="filter-select">
            <option>Date</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      <div className="results-bar">
        <span className="results-count">Showing {filteredEvents.length} of {events.length} events</span>
        <button className="advanced-filters-btn">
          <span>⚡</span>
          Advanced Filters
        </button>
      </div>

      <div className={`events-grid ${viewMode}`}>
        {filteredEvents.map((event) => (
          <div key={event.id} className="event-card-browse">
            <div className="event-card-image">
              <img src={event.image} alt={event.title} />
              <span className={`event-badge-browse badge-${event.category}`}>
                {event.category}
              </span>
              <span className="event-price">${event.price}</span>
            </div>
            <div className="event-card-content">
              <div className="event-header-row">
                <h3 className="event-card-title">{event.title}</h3>
                <div className="event-rating">
                  <span className="star">⭐</span>
                  <span>{event.rating}</span>
                </div>
              </div>
              <p className="event-card-description">{event.description}</p>
              <div className="event-meta-info">
                <div className="event-meta-item">
                  <span className="meta-icon">📅</span>
                  <span>{event.date}</span>
                </div>
                <div className="event-meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{event.location}</span>
                </div>
              </div>
              <button className="view-details-btn">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseEvents;
