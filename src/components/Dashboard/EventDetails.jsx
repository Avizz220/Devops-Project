import React, { useState, useEffect } from 'react';
import './EventDetails.css';
import { API_BASE_URL, STORAGE_KEYS } from '../../config';
import Swal from 'sweetalert2';

const EventDetails = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's events
  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        
        console.log('Raw user string from localStorage:', userStr); // Debug log
        
        if (!userStr) {
          console.error('No user found in localStorage');
          Swal.fire({
            icon: 'warning',
            title: 'Not Logged In',
            text: 'Please log in to view your events.',
            confirmButtonColor: '#1a1f35'
          });
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        console.log('Parsed user object:', user); // Debug log
        
        if (!user || !user.id) {
          console.error('User object is invalid:', user);
          Swal.fire({
            icon: 'warning',
            title: 'Invalid User Data',
            text: 'Please log in again.',
            confirmButtonColor: '#1a1f35'
          });
          setLoading(false);
          return;
        }

        console.log(`Fetching events for user ID: ${user.id} (${user.name})`); // Debug log
        const response = await fetch(`${API_BASE_URL}/api/events/user/${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        console.log('Fetched events data:', data); // Debug log
        
        // Handle both array and object response formats
        const eventsArray = Array.isArray(data) ? data : (data.events || []);
        console.log(`Found ${eventsArray.length} events for user ${user.name}`); // Debug log
        setMyEvents(eventsArray);
        
        // Select first event by default
        if (eventsArray.length > 0) {
          setSelectedEvent(eventsArray[0]);
          console.log('Selected first event:', eventsArray[0].event_name); // Debug log
        } else {
          console.log('No events found for this user'); // Debug log
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load your events. Please try again.',
          confirmButtonColor: '#1a1f35'
        });
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  // Calculate booking rate
  const calculateBookingRate = (booked, capacity) => {
    return Math.round((booked / capacity) * 100);
  };

  // Ticket sales data (dummy for now - can be enhanced later)
  const ticketSalesData = [
    { week: 'Week 1', sales: 50 },
    { week: 'Week 2', sales: 100 },
    { week: 'Week 3', sales: 150 },
    { week: 'Week 4', sales: 220 },
    { week: 'Week 5', sales: 300 },
    { week: 'Week 6', sales: 380 },
    { week: 'Week 7', sales: 450 }
  ];

  const maxSales = Math.max(...ticketSalesData.map(d => d.sales));

  // Show loading state
  if (loading) {
    return (
      <div className="event-details-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your events...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no events
  if (myEvents.length === 0) {
    return (
      <div className="event-details-container">
        <div className="event-details-header">
          <div>
            <h1 className="event-details-title">My Events</h1>
            <p className="event-details-subtitle">Manage and analyze event performance</p>
          </div>
        </div>
        <div className="empty-state-full">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h2>No Events Yet</h2>
          <p>You haven't created any events yet. Create your first event to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-details-container">
      {/* Header */}
      <div className="event-details-header">
        <div>
          <h1 className="event-details-title">My Events</h1>
          <p className="event-details-subtitle">You have {myEvents.length} event{myEvents.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Events List */}
      <div className="my-events-grid">
        {myEvents.map((event) => (
          <div 
            key={event.id} 
            className={`my-event-card ${selectedEvent?.id === event.id ? 'selected' : ''}`}
            onClick={() => setSelectedEvent(event)}
          >
            <div className="my-event-image">
              {event.photo_url ? (
                <img src={`${API_BASE_URL}${event.photo_url}`} alt={event.event_name} />
              ) : (
                <div className="no-image-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
            </div>
            <div className="my-event-info">
              <h3 className="my-event-title">{event.event_name}</h3>
              <div className="my-event-meta">
                <span className={`category-badge-small ${event.event_category}`}>
                  {event.event_category}
                </span>
                <span className="my-event-date">
                  {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="my-event-stats">
                <div className="my-event-stat">
                  <span className="stat-label">Booked:</span>
                  <span className="stat-value">{event.booked || 0}/{event.capacity}</span>
                </div>
                <div className="my-event-stat">
                  <span className="stat-label">Price:</span>
                  <span className="stat-value">${event.ticket_price}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Event Details */}
      {selectedEvent && (
        <>
          {/* Event Card */}
          <div className="event-main-card">
            <div className="event-image-section">
              {selectedEvent.photo_url ? (
                <img src={`${API_BASE_URL}${selectedEvent.photo_url}`} alt={selectedEvent.event_name} className="event-main-image" />
              ) : (
                <div className="event-main-image no-image-placeholder-large">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
            </div>
            <div className="event-info-section">
              <div className="event-title-row">
                <h2 className="event-main-title">{selectedEvent.event_name}</h2>
                <span className={`category-badge-detail ${selectedEvent.event_category}`}>{selectedEvent.event_category}</span>
              </div>
          
          <div className="event-meta-grid">
            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <div>
                <div className="meta-label">Date</div>
                <div className="meta-value">{formatDate(selectedEvent.event_date)}</div>
              </div>
            </div>

            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div>
                <div className="meta-label">Time</div>
                <div className="meta-value">{formatTime(selectedEvent.event_time)}</div>
              </div>
            </div>

            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div>
                <div className="meta-label">Location</div>
                <div className="meta-value">{selectedEvent.location}</div>
              </div>
            </div>

            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <div>
                <div className="meta-label">Price</div>
                <div className="meta-value">${selectedEvent.ticket_price}</div>
              </div>
            </div>
          </div>

          <div className="event-stats-row">
            <div className="stat-box">
              <div className="stat-label">Capacity</div>
              <div className="stat-value">{selectedEvent.capacity.toLocaleString()}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Booked</div>
              <div className="stat-value booked">{(selectedEvent.booked || 0).toLocaleString()}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Booking Rate</div>
              <div className="stat-value">{calculateBookingRate(selectedEvent.booked || 0, selectedEvent.capacity)}%</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Created</div>
              <div className="stat-value">
                {new Date(selectedEvent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="event-tabs">
        <button
          className={`event-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={`event-tab ${activeTab === 'attendees' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendees')}
        >
          Attendees
        </button>
        <button
          className={`event-tab ${activeTab === 'related' ? 'active' : ''}`}
          onClick={() => setActiveTab('related')}
        >
          Related Events
        </button>
      </div>

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="analytics-content">
          <div className="charts-container">
            {/* Ticket Sales Chart */}
            <div className="chart-box">
              <h3 className="chart-title">Ticket Sales Over Time</h3>
              <div className="bar-chart-container">
                <div className="chart-y-axis">
                  <span>600</span>
                  <span>450</span>
                  <span>300</span>
                  <span>150</span>
                  <span>0</span>
                </div>
                <div className="bar-chart-content">
                  {ticketSalesData.map((item, index) => (
                    <div key={index} className="bar-column">
                      <div className="bar-wrapper">
                        <div
                          className="bar"
                          style={{ height: `${(item.sales / maxSales) * 100}%` }}
                        >
                          <div className="bar-tooltip">{item.sales}</div>
                        </div>
                      </div>
                      <div className="bar-label">{item.week}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Registration Trend Chart */}
            <div className="chart-box">
              <h3 className="chart-title">Registration Trend</h3>
              <div className="line-chart-container">
                <div className="chart-y-axis">
                  <span>280</span>
                  <span>210</span>
                  <span>140</span>
                  <span>70</span>
                  <span>0</span>
                </div>
                <div className="line-chart-content">
                  <svg className="line-chart-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                        <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 200 L 0 200 L 100 180 L 200 150 L 300 120 L 400 90 L 500 70 L 600 70 L 600 200 Z"
                      fill="url(#lineGradient)"
                    />
                    <path
                      d="M 0 200 L 100 180 L 200 150 L 300 120 L 400 90 L 500 70"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="line-chart-x-axis">
                    <span>2025-01-01</span>
                    <span>2025-01-15</span>
                    <span>2025-02-01</span>
                    <span>2025-02-15</span>
                    <span>2025-03-01</span>
                    <span>2025-03-15</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendees Tab Content */}
      {activeTab === 'attendees' && (
        <div className="attendees-content">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h3>Attendee List</h3>
            <p>View and manage event attendees</p>
          </div>
        </div>
      )}

      {/* Related Events Tab Content */}
      {activeTab === 'related' && (
        <div className="related-content">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>Related Events</h3>
            <p>Similar or connected events</p>
          </div>
        </div>
      )}
    </>
      )}
    </div>
  );
};

export default EventDetails;
