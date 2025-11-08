import React, { useState } from 'react';
import './EventDetails.css';

const EventDetails = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  // Sample event data
  const event = {
    title: 'Tech Innovation Summit 2025',
    description: 'Join industry leaders discussing the future of technology and innovation.',
    category: 'tech',
    date: 'Wednesday, October 15, 2025',
    time: '09:00',
    location: 'San Francisco Convention Center',
    price: '$299',
    capacity: 1500,
    booked: 1200,
    bookingRate: 80,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
  };

  // Ticket sales data
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

  // Registration trend data (line chart data points)
  const registrationData = [
    { date: '2025-01-01', count: 0 },
    { date: '2025-01-15', count: 50 },
    { date: '2025-02-01', count: 120 },
    { date: '2025-02-15', count: 180 },
    { date: '2025-03-01', count: 240 },
    { date: '2025-03-15', count: 280 }
  ];

  return (
    <div className="event-details-container">
      {/* Header */}
      <div className="event-details-header">
        <div>
          <h1 className="event-details-title">My Events</h1>
          <p className="event-details-subtitle">Manage and analyze event performance</p>
        </div>
        <div className="header-actions">
          <button className="action-btn share-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            Share
          </button>
          <button className="action-btn export-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export
          </button>
          <button className="action-btn edit-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <button className="action-btn delete-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Event Card */}
      <div className="event-main-card">
        <div className="event-image-section">
          <img src={event.image} alt={event.title} className="event-main-image" />
        </div>
        <div className="event-info-section">
          <div className="event-title-row">
            <h2 className="event-main-title">{event.title}</h2>
            <span className={`category-badge-detail ${event.category}`}>{event.category}</span>
          </div>
          <p className="event-description">{event.description}</p>
          
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
                <div className="meta-value">{event.date}</div>
              </div>
            </div>

            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div>
                <div className="meta-label">Time</div>
                <div className="meta-value">{event.time}</div>
              </div>
            </div>

            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div>
                <div className="meta-label">Location</div>
                <div className="meta-value">{event.location}</div>
              </div>
            </div>

            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <div>
                <div className="meta-label">Price</div>
                <div className="meta-value">{event.price}</div>
              </div>
            </div>
          </div>

          <div className="event-stats-row">
            <div className="stat-box">
              <div className="stat-label">Capacity</div>
              <div className="stat-value">{event.capacity.toLocaleString()}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Booked</div>
              <div className="stat-value booked">{event.booked.toLocaleString()}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Booking Rate</div>
              <div className="stat-value">{event.bookingRate}%</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Rating</div>
              <div className="stat-value rating">
                <span className="star">⭐</span> {event.rating}
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
    </div>
  );
};

export default EventDetails;
