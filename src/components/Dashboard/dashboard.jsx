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
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [eventsOverview, setEventsOverview] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalEvents: 0,
    trendingEvent: { name: 'Loading...', count: 0 },
    userOrganizedEvents: 0,
    totalMembers: 0
  });

  const [eventName, setEventName] = useState('');
  const [eventCategory, setEventCategory] = useState('tech');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [eventPhoto, setEventPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    let parsedUser = null;
    if (raw) {
      try {
        parsedUser = JSON.parse(raw);
        setUser(parsedUser);
      } catch {
        setUser({ name: 'User' });
      }
    }

    fetchUpcomingEvents();
    fetchCategoryData();

    if (parsedUser?.id) {
      fetchEventsOverview(parsedUser.id);
      fetchRecentActivity(parsedUser.id);
      fetchDashboardStats(parsedUser.id);
    }

    const handleProfileUpdate = (event) => {
      setUser(event.detail);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const events = await response.json();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = events.filter(event => {
        const eventDate = new Date(event.event_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });

      upcoming.sort((a, b) => {
        const dateA = new Date(a.event_date);
        const dateB = new Date(b.event_date);
        return dateA - dateB;
      });

      setUpcomingEvents(upcoming.slice(0, 3));
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setUpcomingEvents([]);
    }
  };

  const fetchCategoryData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const events = await response.json();

      const categoryCounts = {};
      events.forEach(event => {
        const category = event.event_category;
        if (category) {

          const displayName = category.charAt(0).toUpperCase() + category.slice(1);
          categoryCounts[displayName] = (categoryCounts[displayName] || 0) + 1;
        }
      });

      const categoryArray = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);
      
      setCategoryData(categoryArray);
    } catch (error) {
      console.error('Error fetching category data:', error);
      setCategoryData([]);
    }
  };

  const fetchEventsOverview = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/user/${userId}/overview`);
      if (!response.ok) {
        throw new Error('Failed to fetch events overview');
      }
      
      const data = await response.json();
      setEventsOverview(data);
    } catch (error) {
      console.error('Error fetching events overview:', error);
      setEventsOverview([]);
    }
  };

  const fetchRecentActivity = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/recent-activity`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent activity');
      }
      const activities = await response.json();
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    }
  };

  const fetchDashboardStats = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const stats = await response.json();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

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

        fetchUpcomingEvents();
        fetchCategoryData();

        if (user?.id) {
          fetchEventsOverview(user.id);
          fetchRecentActivity(user.id);
          fetchDashboardStats(user.id);
        }
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
  const maxCategory = categoryData.length > 0 ? Math.max(...categoryData.map(d => d.value)) : 1;

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
            {user?.profile_picture ? (
              <img 
                src={`${API_BASE_URL}${user.profile_picture}`} 
                alt={user.name}
                className="welcome-avatar-img"
              />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
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
                <p className="page-subtitle">Welcome back! Here's what's happening with events.</p>
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
                <div className="stat-value">{dashboardStats.totalEvents}</div>
                <div className="stat-subtext">Created by all users</div>
              </div>

              <div className="stat-card card-animate" style={{ animationDelay: '0.1s' }}>
                <div className="stat-header">
                  <span className="stat-label">Trending Event</span>
                  <span className="stat-icon">�</span>
                </div>
                <div className="stat-value" style={{ fontSize: '1.3rem', lineHeight: '1.3' }}>
                  {dashboardStats.trendingEvent.name}
                </div>
                <div className="stat-subtext">
                  {dashboardStats.trendingEvent.count} {dashboardStats.trendingEvent.count === 1 ? 'user' : 'users'} interested
                </div>
              </div>

              <div className="stat-card card-animate" style={{ animationDelay: '0.2s' }}>
                <div className="stat-header">
                  <span className="stat-label">Your Organized Events</span>
                  <span className="stat-icon">🎯</span>
                </div>
                <div className="stat-value">{dashboardStats.userOrganizedEvents}</div>
                <div className="stat-subtext">Events you created</div>
              </div>

              <div className="stat-card card-animate" style={{ animationDelay: '0.3s' }}>
                <div className="stat-header">
                  <span className="stat-label">Members</span>
                  <span className="stat-icon">👥</span>
                </div>
                <div className="stat-value">{dashboardStats.totalMembers}</div>
                <div className="stat-subtext">Registered event organizers</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-icon">�</span>
                  <h3>Your Events Overview</h3>
                </div>
                <div className="chart-container">
                  {eventsOverview.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                      <p style={{ fontSize: '16px', marginBottom: '8px' }}>No events created yet</p>
                      <p style={{ fontSize: '14px', color: '#9ca3af' }}>Create your first event to see overview data</p>
                    </div>
                  ) : (
                    <div className="overview-table-wrapper">
                      <table className="overview-table">
                        <thead>
                          <tr>
                            <th>Event Name</th>
                            <th>Interested</th>
                            <th>Not Interested</th>
                            <th>Going</th>
                            <th>Revenue (LKR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventsOverview.map((event) => (
                            <tr key={event.event_id}>
                              <td className="event-name-col">{event.event_name}</td>
                              <td className="count-col">{event.interested}</td>
                              <td className="count-col">{event.not_interested}</td>
                              <td className="count-col">{event.going}</td>
                              <td className="revenue-col">
                                {Number(event.revenue).toLocaleString('en-US', { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Event Categories</h3>
                </div>
                <div className="chart-container">
                  <div className="bar-chart">
                    {categoryData.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                        No events to display
                      </div>
                    ) : (
                      categoryData.map((item, index) => (
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
                      ))
                    )}
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
                  {upcomingEvents.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      No upcoming events
                    </div>
                  ) : (
                    upcomingEvents.map((event, index) => (
                      <div 
                        key={event.id} 
                        className="event-card-new"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="event-image">
                          <img src={`${API_BASE_URL}${event.photo_url}`} alt={event.event_name} />
                          <span className={`event-badge badge-${event.event_category}`}>{event.event_category}</span>
                        </div>
                        <div className="event-details">
                          <h4>{event.event_name}</h4>
                          <div className="event-date-loc">
                            <span className="event-date-icon">📅 {formatEventDate(event.event_date)}</span>
                            <span className="event-loc-icon">📍 {event.location}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="activity-card">
                <div className="card-header">
                  <h3>
                    <span className="activity-icon">🔔</span>
                    Your Recent Activity
                  </h3>
                </div>
                <div className="activity-list-new">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
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
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No recent activity yet. Start creating events or marking interest in events!</p>
                    </div>
                  )}
                </div>
                <button className="view-all-notifications">view All Notifications</button>
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
