import React, { useState } from 'react';
import './BrowseEvents.css';

const BrowseEvents = () => {
  const [searchQuery, setSearchQuery] = useState('');
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
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop'
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
      image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&h=400&fit=crop'
    },
    {
      id: 3,
      title: 'Food & Wine Festival',
      category: 'food',
      price: 89,
      rating: 4.7,
      description: 'Taste exquisite dishes and wines from renowned chefs and wineries.',
      date: 'Aug 15, 2025 at 12:00',
      location: 'Napa Valley',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'
    },
    {
      id: 4,
      title: 'Tech Innovation Summit 2025',
      category: 'tech',
      price: 299,
      rating: 4.9,
      description: 'Discover the latest in technology and innovation.',
      date: 'Oct 15, 2025 at 09:00',
      location: 'San Francisco Convention Center',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop'
    },
    {
      id: 5,
      title: 'Modern Art Exhibition',
      category: 'art',
      price: 45,
      rating: 4.6,
      description: 'Explore contemporary art from emerging artists.',
      date: 'Nov 5, 2025 at 10:00',
      location: 'Museum of Modern Art',
      image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600&h=400&fit=crop'
    },
    {
      id: 6,
      title: 'Startup Networking Event',
      category: 'tech',
      price: 0,
      rating: 4.5,
      description: 'Connect with entrepreneurs and investors.',
      date: 'Dec 10, 2025 at 18:30',
      location: 'TechHub Downtown',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop'
    }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || event.category === selectedCategory.toLowerCase();
    const matchesLocation = selectedLocation === 'All Locations'; // Can add location filtering logic
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="browse-events-container">
      <div className="browse-header">
        <div>
          <h1 className="browse-title">Browse Events</h1>
          <p className="browse-subtitle">Discover and manage all your events</p>
        </div>
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            ⊞
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <span className="filter-icon">🔍</span>
          <h3>Filters & Search</h3>
        </div>
        
        <div className="filters-row">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select 
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option>All Categories</option>
            <option>Tech</option>
            <option>Music</option>
            <option>Art</option>
            <option>Food</option>
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
            <option>Next Month</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span>Showing {filteredEvents.length} of {events.length} events</span>
        <button className="advanced-filters-btn">
          <span>⚙</span> Advanced Filters
        </button>
      </div>

      {/* Events Grid/List */}
      <div className={`events-display ${viewMode}`}>
        {filteredEvents.map((event, index) => (
          <div 
            key={event.id} 
            className="event-card-browse"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="event-image-wrapper">
              <img src={event.image} alt={event.title} />
              <span className={`event-category-badge badge-${event.category}`}>
                {event.category}
              </span>
              <span className="event-price-badge">
                {event.price === 0 ? 'Free' : `$${event.price}`}
              </span>
            </div>
            <div className="event-card-content">
              <div className="event-card-header">
                <h3>{event.title}</h3>
                <div className="event-rating">
                  <span className="star">⭐</span>
                  <span>{event.rating}</span>
                </div>
              </div>
              <p className="event-description">{event.description}</p>
              <div className="event-card-footer">
                <div className="event-meta-item">
                  <span className="meta-icon">📅</span>
                  <span>{event.date}</span>
                </div>
                <div className="event-meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseEvents;
