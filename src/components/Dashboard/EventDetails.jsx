import React, { useState, useEffect } from 'react';
import './EventDetails.css';
import { API_BASE_URL, STORAGE_KEYS } from '../../config';
import Swal from 'sweetalert2';

const EventDetails = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrationTrendData, setRegistrationTrendData] = useState([]);

  const [editEventName, setEditEventName] = useState('');
  const [editEventCategory, setEditEventCategory] = useState('tech');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventTime, setEditEventTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editTicketPrice, setEditTicketPrice] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editEventPhoto, setEditEventPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        
        console.log('Raw user string from localStorage:', userStr);
        
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
        console.log('Parsed user object:', user);
        
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

        console.log(`Fetching events for user ID: ${user.id} (${user.name})`);
        const response = await fetch(`${API_BASE_URL}/api/events/user/${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        console.log('Fetched events data:', data);

        const eventsArray = Array.isArray(data) ? data : (data.events || []);
        console.log(`Found ${eventsArray.length} events for user ${user.name}`);
        setMyEvents(eventsArray);

        if (eventsArray.length > 0) {
          setSelectedEvent(eventsArray[0]);
          console.log('Selected first event:', eventsArray[0].event_name);
        } else {
          console.log('No events found for this user');
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

  useEffect(() => {
    const fetchRegistrationTrend = async () => {
      try {
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        if (!userStr) return;

        const user = JSON.parse(userStr);
        if (!user || !user.id) return;

        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/registration-trend`);
        if (!response.ok) {
          throw new Error('Failed to fetch registration trend');
        }

        const data = await response.json();
        setRegistrationTrendData(data);
      } catch (error) {
        console.error('Error fetching registration trend:', error);
        setRegistrationTrendData([]);
      }
    };

    fetchRegistrationTrend();
  }, [myEvents]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const calculateBookingRate = (booked, capacity) => {
    return Math.round((booked / capacity) * 100);
  };

  const handleDeleteEvent = async (eventId) => {
    const result = await Swal.fire({
      title: 'Delete Event?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        const user = JSON.parse(userStr);

        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}?organizer_id=${user.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete event');
        }

        setMyEvents(prev => prev.filter(e => e.id !== eventId));

        if (selectedEvent?.id === eventId) {
          setModalOpen(false);
          setSelectedEvent(null);
        }

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Event has been deleted.',
          confirmButtonColor: '#1a1f35'
        });
      } catch (error) {
        console.error('Error deleting event:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete event. Please try again.',
          confirmButtonColor: '#1a1f35'
        });
      }
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEditEventName(event.event_name);
    setEditEventCategory(event.event_category);
    setEditEventDate(event.event_date.split('T')[0]);
    setEditEventTime(event.event_time.substring(0, 5));
    setEditLocation(event.location);
    setEditTicketPrice(event.ticket_price);
    setEditCapacity(event.capacity);
    setEditEventPhoto(null);
    setEditModalOpen(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      const user = JSON.parse(userStr);

      const formData = new FormData();
      formData.append('event_name', editEventName);
      formData.append('event_category', editEventCategory);
      formData.append('event_date', editEventDate);
      formData.append('event_time', editEventTime);
      formData.append('location', editLocation);
      formData.append('ticket_price', editTicketPrice);
      formData.append('capacity', editCapacity);
      formData.append('organizer_id', user.id);
      
      if (editEventPhoto) {
        formData.append('photo', editEventPhoto);
      }

      const response = await fetch(`${API_BASE_URL}/api/events/${editingEvent.id}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      const updatedEvents = myEvents.map(ev => {
        if (ev.id === editingEvent.id) {
          return {
            ...ev,
            event_name: editEventName,
            event_category: editEventCategory,
            event_date: editEventDate,
            event_time: editEventTime,
            location: editLocation,
            ticket_price: editTicketPrice,
            capacity: editCapacity,
            photo_url: editEventPhoto ? `/uploads/${editEventPhoto.name}` : ev.photo_url
          };
        }
        return ev;
      });
      
      setMyEvents(updatedEvents);

      if (selectedEvent?.id === editingEvent.id) {
        setSelectedEvent(updatedEvents.find(e => e.id === editingEvent.id));
      }

      setEditModalOpen(false);
      setEditingEvent(null);

      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Event has been updated successfully.',
        confirmButtonColor: '#1a1f35'
      });

      setIsSubmitting(false);
    } catch (error) {
      console.error('Error updating event:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update event. Please try again.',
        confirmButtonColor: '#1a1f35'
      });
      setIsSubmitting(false);
    }
  };

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
            className="my-event-card"
          >
            {/* Edit/Delete Actions */}
            <div className="event-card-actions">
              <button 
                className="edit-btn" 
                onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                title="Edit Event"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button 
                className="delete-btn" 
                onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                title="Delete Event"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>

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
              <button 
                className="view-details-btn"
                onClick={() => { setSelectedEvent(event); setModalOpen(true); }}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for selected event details */}
      {modalOpen && selectedEvent && (
        <div
          className="event-modal-overlay"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close">✕</button>
            <div className="event-main-card modal-card">
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
                    <div>
                      <div className="meta-label">Date</div>
                      <div className="meta-value">{formatDate(selectedEvent.event_date)}</div>
                    </div>
                  </div>
                  <div className="meta-item">
                    <div>
                      <div className="meta-label">Time</div>
                      <div className="meta-value">{formatTime(selectedEvent.event_time)}</div>
                    </div>
                  </div>
                  <div className="meta-item">
                    <div>
                      <div className="meta-label">Location</div>
                      <div className="meta-value">{selectedEvent.location}</div>
                    </div>
                  </div>
                  <div className="meta-item">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {registrationTrendData.length > 0 ? (
                <div className="line-chart-container">
                  <div className="chart-y-axis">
                    {(() => {
                      const maxValue = Math.max(...registrationTrendData.map(d => d.count), 1);
                      const step = Math.ceil(maxValue / 4);
                      return [step * 4, step * 3, step * 2, step, 0].map((val, idx) => (
                        <span key={idx}>{val}</span>
                      ));
                    })()}
                  </div>
                  <div className="line-chart-content">
                    <svg className="line-chart-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                          <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const maxValue = Math.max(...registrationTrendData.map(d => d.count), 1);
                        const points = registrationTrendData.map((d, i) => {
                          const x = (i / (registrationTrendData.length - 1)) * 600;
                          const y = 200 - (d.count / maxValue) * 200;
                          return `${x} ${y}`;
                        }).join(' L ');
                        
                        const areaPath = `M 0 200 L ${points} L 600 200 Z`;
                        const linePath = `M ${points}`;
                        
                        return (
                          <>
                            <path d={areaPath} fill="url(#lineGradient)" />
                            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="3" />
                          </>
                        );
                      })()}
                    </svg>
                    <div className="line-chart-x-axis">
                      {registrationTrendData.map((d, idx) => (
                        <span key={idx}>{d.date}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-chart-state">
                  <p>No registration data available yet. Users will appear here when they mark interest in your events.</p>
                </div>
              )}
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

      {/* Edit Event Modal */}
      {editModalOpen && editingEvent && (
        <div className="event-modal-overlay" onClick={() => { setEditModalOpen(false); setEditingEvent(null); }}>
          <div className="event-modal edit-event-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => { setEditModalOpen(false); setEditingEvent(null); }}
              aria-label="Close"
            >
              ✕
            </button>
            
            <h2 className="edit-modal-title">Edit Event</h2>
            
            <form onSubmit={handleUpdateEvent} className="edit-event-form">
              <div className="form-group">
                <label htmlFor="edit-event-name">Event Name *</label>
                <input
                  id="edit-event-name"
                  type="text"
                  value={editEventName}
                  onChange={(e) => setEditEventName(e.target.value)}
                  required
                  placeholder="Enter event name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-event-category">Category *</label>
                <select
                  id="edit-event-category"
                  value={editEventCategory}
                  onChange={(e) => setEditEventCategory(e.target.value)}
                  required
                >
                  <option value="tech">Technology</option>
                  <option value="music">Music</option>
                  <option value="sports">Sports</option>
                  <option value="food">Food & Drink</option>
                  <option value="art">Art & Culture</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="health">Health & Wellness</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-event-date">Date *</label>
                  <input
                    id="edit-event-date"
                    type="date"
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-event-time">Time *</label>
                  <input
                    id="edit-event-time"
                    type="time"
                    value={editEventTime}
                    onChange={(e) => setEditEventTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-location">Location *</label>
                <input
                  id="edit-location"
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  required
                  placeholder="Enter event location"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-ticket-price">Ticket Price ($) *</label>
                  <input
                    id="edit-ticket-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editTicketPrice}
                    onChange={(e) => setEditTicketPrice(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-capacity">Capacity *</label>
                  <input
                    id="edit-capacity"
                    type="number"
                    min="1"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    required
                    placeholder="Enter max capacity"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-event-photo">Event Photo (Optional - leave empty to keep current)</label>
                <input
                  id="edit-event-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditEventPhoto(e.target.files[0])}
                />
                {editingEvent.photo_url && (
                  <p className="current-photo-info">
                    Current photo: {editingEvent.photo_url.split('/').pop()}
                  </p>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => { setEditModalOpen(false); setEditingEvent(null); }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
