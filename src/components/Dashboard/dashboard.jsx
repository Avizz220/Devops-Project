import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';
import { STORAGE_KEYS, API_BASE_URL } from '../../config';
import BrowseEvents from './BrowseEvents';
import Settings from './Settings';
import EventDetails from './EventDetails';
import AttendeeInsights from './AttendeeInsights';
import { useAuth } from '../../App';
import Swal from 'sweetalert2';

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form states
  const [eventName, setEventName] = useState('');
  const [eventCategory, setEventCategory] = useState('tech');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [eventPhoto, setEventPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats data
  const stats = {
    totalEvents: 125,
    totalBookings: 45680,
    revenue: '$2.85M',
    avgRating: 4.7,
    eventsChange: '+12.5%',
    bookingsChange: '+8.2%',
    revenueChange: '+23.5%',
    ratingChange: '+2.1%'
  };

  // Chart data
  const revenueData = [
    { month: 'Jan', value: 280 },
    { month: 'Feb', value: 310 },
    { month: 'Mar', value: 290 },
    { month: 'Apr', value: 330 },
    { month: 'May', value: 350 },
    { month: 'Jun', value: 320 },
    { month: 'Jul', value: 380 },
    { month: 'Aug', value: 400 },
    { month: 'Sep', value: 370 }
  ];

  const categoryData = [
    { name: 'Tech', value: 45 },
    { name: 'Music', value: 32 },
    { name: 'Art', value: 28 },
    { name: 'Food', value: 20 }
  ];

  const upcomingEvents = [
    { 
      id: 1, 
      title: 'Tech Innovation Summit 2025', 
      date: 'Oct 15, 2025',
      location: 'San Francisco Convention Center',
      type: 'tech',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop'
    },
    { 
      id: 2, 
      title: 'Summer Music Festival', 
      date: 'Jul 20, 2025',
      location: 'Golden Gate Park',
      type: 'music',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop'
    },
    { 
      id: 3, 
      title: 'Modern Art Exhibition', 
      date: 'Nov 5, 2025',
      location: 'Museum of Modern Art',
      type: 'art',
      image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop'
    }
  ];

  const recentActivity = [
    { 
      id: 1, 
      action: 'Tech Innovation Summit reaching capacity', 
      time: '2 hours ago',
      color: '#f59e0b'
    },
    { 
      id: 2, 
      action: 'New event registration: AI Conference', 
      time: '4 hours ago',
      color: '#3b82f6'
    },
    { 
      id: 3, 
      action: 'Payment received: $15,000', 
      time: '6 hours ago',
      color: '#10b981'
    }
  ];

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser({ name: 'User' });
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const resetForm = () => {
    setEventName('');
    setEventCategory('tech');
    setEventDate('');
    setEventTime('');
    setLocation('');
    setTicketPrice('');
    setCapacity('');
    setEventPhoto(null);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'User not logged in'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('event_name', eventName);
      formData.append('event_category', eventCategory);
      formData.append('event_date', eventDate);
      formData.append('event_time', eventTime);
      formData.append('location', location);
      formData.append('ticket_price', ticketPrice);
      formData.append('capacity', capacity);
      formData.append('organizer_id', user.id);
      if (eventPhoto) {
        formData.append('photo', eventPhoto);
      }

      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Event Created!',
          text: 'Your event has been created successfully.',
          timer: 2000,
          showConfirmButton: false
        });
        resetForm();
        setShowCreateModal(false);
      } else {
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to create event. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxRevenue = Math.max(...revenueData.map(d => d.value));
  const maxCategory = Math.max(...categoryData.map(d => d.value));

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-brand">EventDash</h1>
          <p className="sidebar-subtitle">Event Management Dashboard</p>
        </div>

        {/* Welcome User Section */}
        <div className="sidebar-user-welcome">
          <div className="welcome-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="welcome-text">
            <h3>Welcome back!</h3>
            <p>{user?.name || 'User'}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeMenu === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveMenu('overview')}
          >
            <span className="nav-icon">🏠</span>
            <span>Overview</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveMenu('browse')}
          >
            <span className="nav-icon">🔍</span>
            <span>Browse Events</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'details' ? 'active' : ''}`}
            onClick={() => setActiveMenu('details')}
          >
            <span className="nav-icon">📋</span>
            <span>My Events</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveMenu('insights')}
          >
            <span className="nav-icon">👥</span>
            <span>Attendee Insights</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-stats">
          <h4>Quick Stats</h4>
          <div className="quick-stat">
            <span>Active Events</span>
            <strong>125</strong>
          </div>
          <div className="quick-stat">
            <span>Total Revenue</span>
            <strong>$2.85M</strong>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeMenu === 'overview' && (
          <>
            <header className="dashboard-header">
              <div>
                <h1 className="page-title">Dashboard Overview</h1>
                <p className="page-subtitle">Welcome back! Here's what's happening with your events.</p>
              </div>
              <button className="btn-create-event" onClick={() => setShowCreateModal(true)}>
                <span className="btn-icon">📅</span>
                Create Event
              </button>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card card-animate">
                <div className="stat-header">
                  <span className="stat-label">Total Events</span>
                  <span className="stat-icon">📅</span>
                </div>
                <div className="stat-value">{stats.totalEvents}</div>
                <div className="stat-footer">
                  <span className="stat-change positive">{stats.eventsChange} from last month</span>
                </div>
                <div className="stat-subtext">Active events this month</div>
              </div>

              <div className="stat-card card-animate" style={{ animationDelay: '0.1s' }}>
                <div className="stat-header">
                  <span className="stat-label">Total Bookings</span>
                  <span className="stat-icon">👥</span>
                </div>
                <div className="stat-value">{stats.totalBookings.toLocaleString()}</div>
                <div className="stat-footer">
                  <span className="stat-change positive">{stats.bookingsChange} from last month</span>
                </div>
                <div className="stat-subtext">Tickets sold this month</div>
              </div>

              <div className="stat-card card-animate" style={{ animationDelay: '0.2s' }}>
                <div className="stat-header">
                  <span className="stat-label">Revenue</span>
                  <span className="stat-icon">💰</span>
                </div>
                <div className="stat-value">{stats.revenue}</div>
                <div className="stat-footer">
                  <span className="stat-change positive">{stats.revenueChange} from last month</span>
                </div>
                <div className="stat-subtext">Total revenue generated</div>
              </div>

              <div className="stat-card card-animate" style={{ animationDelay: '0.3s' }}>
                <div className="stat-header">
                  <span className="stat-label">Avg Rating</span>
                  <span className="stat-icon">⭐</span>
                </div>
                <div className="stat-value">{stats.avgRating}</div>
                <div className="stat-footer">
                  <span className="stat-change positive">{stats.ratingChange} from last month</span>
                </div>
                <div className="stat-subtext">Customer satisfaction</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-icon">📈</span>
                  <h3>Revenue Trends</h3>
                </div>
                <div className="chart-container">
                  <div className="area-chart">
                    {revenueData.map((item, index) => (
                      <div key={index} className="chart-column">
                        <div 
                          className="chart-bar"
                          style={{ 
                            height: `${(item.value / maxRevenue) * 100}%`,
                            animationDelay: `${index * 0.1}s`
                          }}
                        >
                          <div className="chart-tooltip">${item.value}k</div>
                        </div>
                        <span className="chart-label">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Event Categories</h3>
                </div>
                <div className="chart-container">
                  <div className="bar-chart">
                    {categoryData.map((item, index) => (
                      <div key={index} className="bar-row">
                        <span className="bar-label">{item.name}</span>
                        <div className="bar-track">
                          <div 
                            className="bar-fill"
                            style={{ 
                              width: `${(item.value / maxCategory) * 100}%`,
                              animationDelay: `${index * 0.15}s`
                            }}
                          />
                        </div>
                        <span className="bar-value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Events and Activity */}
            <div className="bottom-grid">
              <div className="events-card">
                <div className="card-header">
                  <h3>Upcoming Events</h3>
                  <button className="link-btn" onClick={() => setActiveMenu('browse')}>View All</button>
                </div>
                <div className="events-list-new">
                  {upcomingEvents.map((event, index) => (
                    <div 
                      key={event.id} 
                      className="event-card-new"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="event-image">
                        <img src={event.image} alt={event.title} />
                        <span className={`event-badge badge-${event.type}`}>{event.type}</span>
                      </div>
                      <div className="event-details">
                        <h4>{event.title}</h4>
                        <div className="event-date-loc">
                          <span className="event-date-icon">📅 {event.date}</span>
                          <span className="event-loc-icon">📍 {event.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="activity-card">
                <div className="card-header">
                  <h3>
                    <span className="activity-icon">🔔</span>
                    Recent Activity
                  </h3>
                </div>
                <div className="activity-list-new">
                  {recentActivity.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="activity-item-new"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="activity-indicator" style={{ background: activity.color }}></div>
                      <div className="activity-content-new">
                        <p className="activity-text">{activity.action}</p>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="view-all-notifications">View All Notifications</button>
              </div>
            </div>
          </>
        )}

        {activeMenu === 'browse' && <BrowseEvents />}

        {activeMenu === 'details' && <EventDetails />}

        {activeMenu === 'insights' && <AttendeeInsights />}

        {activeMenu === 'settings' && (
          <Settings />
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 Create New Event</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Event Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter event name" 
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Event Category *</label>
                <select 
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  required
                >
                  <option value="tech">Tech</option>
                  <option value="food">Food</option>
                  <option value="music">Music</option>
                  <option value="political">Political</option>
                  <option value="art">Art</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input 
                    type="date" 
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input 
                    type="time" 
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input 
                  type="text" 
                  placeholder="Enter event location" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ticket Price ($) *</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    min="0" 
                    step="0.01" 
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Capacity *</label>
                  <input 
                    type="number" 
                    placeholder="Enter max capacity" 
                    min="1" 
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Event Photo *</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setEventPhoto(e.target.files[0])}
                  required 
                />
                <small className="form-hint">Upload an image (JPG, PNG, GIF - Max 5MB)</small>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
