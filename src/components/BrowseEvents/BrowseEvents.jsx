import React, { useState, useEffect } from 'react';
import '../Dashboard/BrowseEvents.css';
import { API_BASE_URL, STORAGE_KEYS } from '../../config';

const BrowseEvents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid');
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [otherEvents, setOtherEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);

      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      const user = userStr ? JSON.parse(userStr) : null;
      setCurrentUser(user);

      const response = await fetch(`${API_BASE_URL}/api/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const events = await response.json();

      const sortedEvents = events.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      
      setAllEvents(sortedEvents);

      if (user) {
        const userEventsFiltered = sortedEvents.filter(event => event.organizer_id === user.id);
        const othersEventsFiltered = sortedEvents.filter(event => event.organizer_id !== user.id);
        setMyEvents(userEventsFiltered);
        setOtherEvents(othersEventsFiltered);
      } else {
        setMyEvents([]);
        setOtherEvents(sortedEvents);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const filterAndSortEvents = (events) => {
    let filtered = events.filter(event => {

      const matchesSearch = 
        event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || event.event_category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => a.ticket_price - b.ticket_price);
    } else if (sortBy === 'capacity') {
      filtered.sort((a, b) => b.capacity - a.capacity);
    }

    return filtered;
  };

  const filteredMyEvents = filterAndSortEvents(myEvents);
  const filteredOtherEvents = filterAndSortEvents(otherEvents);
  const totalFilteredEvents = filteredMyEvents.length + filteredOtherEvents.length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderEventCard = (event, index) => (
    <div 
      key={event.id} 
      className="event-card-browse"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="event-image-wrapper">
        {event.photo_url ? (
          <img src={`${API_BASE_URL}${event.photo_url}`} alt={event.event_name} />
        ) : (
          <div className="no-image-placeholder">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
        )}
        <span className={`event-category-badge badge-${event.event_category}`}>
          {event.event_category}
        </span>
        <span className="event-price-badge">
          {event.ticket_price === 0 || event.ticket_price === '0' ? 'Free' : `$${event.ticket_price}`}
        </span>
      </div>
      <div className="event-card-content">
        <div className="event-card-header">
          <h3>{event.event_name}</h3>
          <div className="event-capacity-info">
            <span className="capacity-icon">👥</span>
            <span>{event.booked || 0}/{event.capacity}</span>
          </div>
        </div>
        <div className="event-card-footer">
          <div className="event-meta-item">
            <span className="meta-icon">📅</span>
            <span>{formatDate(event.event_date)} at {formatTime(event.event_time)}</span>
          </div>
          <div className="event-meta-item">
            <span className="meta-icon">📍</span>
            <span>{event.location}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="browse-events-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-events-container">
      <div className="browse-header">
        <div>
          <h1 className="browse-title">Browse Events</h1>
          <p className="browse-subtitle">Discover and explore all community events</p>
        </div>
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            ⊞
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
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
              placeholder="Search by event name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select 
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="tech">Technology</option>
            <option value="music">Music</option>
            <option value="sports">Sports</option>
            <option value="food">Food & Drink</option>
            <option value="art">Art & Culture</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
            <option value="health">Health & Wellness</option>
          </select>

          <select 
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="price">Sort by Price</option>
            <option value="capacity">Sort by Capacity</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span>Showing {totalFilteredEvents} of {allEvents.length} events</span>
      </div>

      {/* My Events Section (if user is logged in and has events) */}
      {currentUser && filteredMyEvents.length > 0 && (
        <div className="events-section">
          <div className="section-header">
            <h2 className="section-title">My Events</h2>
            <span className="section-count">{filteredMyEvents.length} event{filteredMyEvents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={`events-display ${viewMode}`}>
            {filteredMyEvents.map((event, index) => renderEventCard(event, index))}
          </div>
        </div>
      )}

      {/* All Other Events Section */}
      <div className="events-section">
        <div className="section-header">
          <h2 className="section-title">{currentUser && myEvents.length > 0 ? 'Other Events' : 'All Events'}</h2>
          <span className="section-count">{filteredOtherEvents.length} event{filteredOtherEvents.length !== 1 ? 's' : ''}</span>
        </div>
        
        {filteredOtherEvents.length > 0 ? (
          <div className={`events-display ${viewMode}`}>
            {filteredOtherEvents.map((event, index) => renderEventCard(event, index))}
          </div>
        ) : (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>No Events Found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseEvents;
