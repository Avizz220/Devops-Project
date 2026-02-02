import React, { useState, useEffect } from 'react';
import './AttendeeInsights.css';
import { API_BASE_URL, STORAGE_KEYS } from '../../config';

const AttendeeInsights = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [attendeeData, setAttendeeData] = useState([]);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [interestedData, setInterestedData] = useState([]);
  const [participantsList, setParticipantsList] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [organizedEvents, setOrganizedEvents] = useState([]);

  useEffect(() => {
    fetchAttendeeInsights();
    fetchInterestedParticipants();
    fetchParticipantsList();
    fetchOrganizedEvents();
  }, []);

  useEffect(() => {

    if (organizedEvents.length > 0) {
      const interval = setInterval(() => {
        setCurrentEventIndex((prevIndex) => 
          (prevIndex + 1) % organizedEvents.length
        );
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [organizedEvents]);

  const fetchAttendeeInsights = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      console.log('User from localStorage:', userStr);
      
      if (!userStr) {
        console.log('No user found in localStorage');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      console.log('Parsed user:', user);
      
      if (!user || !user.id) {
        console.log('No user ID found');
        setLoading(false);
        return;
      }

      console.log('Fetching attendee insights for user:', user.id);
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/attendee-insights`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendee insights');
      }

      const data = await response.json();
      console.log('Attendee insights data:', data);
      
      setAttendeeData(data.eventDistribution || []);
      setTotalAttendees(data.totalAttendees || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendee insights:', error);
      setAttendeeData([]);
      setTotalAttendees(0);
      setLoading(false);
    }
  };

  const fetchInterestedParticipants = async () => {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (!userStr) return;

      const user = JSON.parse(userStr);
      if (!user || !user.id) return;

      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/interested-participants`);
      if (!response.ok) {
        throw new Error('Failed to fetch interested participants');
      }

      const data = await response.json();
      console.log('Interested participants data:', data);
      setInterestedData(data.eventInterests || []);
    } catch (error) {
      console.error('Error fetching interested participants:', error);
      setInterestedData([]);
    }
  };

  const fetchParticipantsList = async () => {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (!userStr) return;

      const user = JSON.parse(userStr);
      if (!user || !user.id) return;

      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/participants-list`);
      if (!response.ok) {
        throw new Error('Failed to fetch participants list');
      }

      const data = await response.json();
      console.log('Participants list data:', data);
      setParticipantsList(data.participants || []);
    } catch (error) {
      console.error('Error fetching participants list:', error);
      setParticipantsList([]);
    }
  };

  const fetchOrganizedEvents = async () => {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (!userStr) return;

      const user = JSON.parse(userStr);
      if (!user || !user.id) return;

      const response = await fetch(`${API_BASE_URL}/api/events/user/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch organized events');
      }

      const data = await response.json();
      console.log('Organized events data:', data);
      setOrganizedEvents(data || []);
    } catch (error) {
      console.error('Error fetching organized events:', error);
      setOrganizedEvents([]);
    }
  };

  const handleRowClick = (participant) => {
    setSelectedProfile(participant);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  };

  const handlePrevEvent = () => {
    setCurrentEventIndex((prevIndex) => 
      prevIndex === 0 ? organizedEvents.length - 1 : prevIndex - 1
    );
  };

  const handleNextEvent = () => {
    setCurrentEventIndex((prevIndex) => 
      (prevIndex + 1) % organizedEvents.length
    );
  };

  const calculatePieSegments = () => {
    if (attendeeData.length === 0) return [];

    const colors = ['#a78bfa', '#6ee7b7', '#fcd34d', '#f87171', '#60a5fa', '#fb923c', '#c084fc', '#34d399'];
    let cumulativePercentage = 0;

    return attendeeData.map((event, index) => {
      const percentage = totalAttendees > 0 ? (event.attendees / totalAttendees) * 100 : 0;
      const startAngle = (cumulativePercentage / 100) * 360 - 90;
      cumulativePercentage += percentage;

      return {
        eventName: event.eventName,
        attendees: event.attendees,
        percentage: percentage,
        color: colors[index % colors.length],
        startAngle,
        dashArray: `${percentage * 5.03} ${100 * 5.03}`
      };
    });
  };

  const pieSegments = calculatePieSegments();

  const stats = {
    totalAttendees: 7600,
    totalAttendeesChange: '+15.3% vs last period',
    avgAge: 32.4,
    avgAgeUnit: 'years old',
    topLocation: 'SF',
    topLocationFull: 'San Francisco',
    engagementRate: '84.2%',
    engagementChange: '+5.7% vs last period'
  };

  const ageDistribution = [
    { range: '18-24', count: 1200 },
    { range: '25-34', count: 2800 },
    { range: '35-44', count: 2000 },
    { range: '45-54', count: 1100 },
    { range: '55+', count: 500 }
  ];

  const maxAge = Math.max(...ageDistribution.map(d => d.count));

  const genderData = {
    female: 52,
    male: 45,
    other: 3
  };

  const topLocations = [
    { rank: 1, city: 'San Francisco', count: 3200 },
    { rank: 2, city: 'New York', count: 2800 },
    { rank: 3, city: 'Los Angeles', count: 2400 },
    { rank: 4, city: 'Chicago', count: 1800 },
    { rank: 5, city: 'Boston', count: 1200 },
    { rank: 6, city: 'Seattle', count: 1000 }
  ];

  const maxLocation = Math.max(...topLocations.map(l => l.count));

  const maxInterested = interestedData.length > 0 
    ? Math.max(...interestedData.map(e => e.interestedCount)) 
    : 1;

  return (
    <div className="attendee-insights-container">
      {/* Header */}
      <div className="insights-header">
        <div>
          <h1 className="insights-title">Attendee Insights</h1>
          <p className="insights-subtitle">Analyze attendee demographics and behavior patterns</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="insights-stats-grid">
        <div className="insight-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Attendees</span>
            <span className="stat-card-icon">👥</span>
          </div>
          <div className="stat-card-value">{totalAttendees.toLocaleString()}</div>
          <div className="stat-card-unit">Users marked "going"</div>
        </div>

        <div className="insight-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Events</span>
            <span className="stat-card-icon">📅</span>
          </div>
          <div className="stat-card-value">{attendeeData.length}</div>
          <div className="stat-card-unit">Events you organized</div>
        </div>

        <div className="insight-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Avg per Event</span>
            <span className="stat-card-icon">📍</span>
          </div>
          <div className="stat-card-value">
            {attendeeData.length > 0 ? Math.round(totalAttendees / attendeeData.length) : 0}
          </div>
          <div className="stat-card-unit">Average attendees</div>
        </div>

        <div className="insight-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Most Popular</span>
            <span className="stat-card-icon">🌐</span>
          </div>
          <div className="stat-card-value" style={{ fontSize: '1.3rem' }}>
            {attendeeData.length > 0 ? attendeeData[0].eventName.substring(0, 15) + (attendeeData[0].eventName.length > 15 ? '...' : '') : 'N/A'}
          </div>
          <div className="stat-card-unit">
            {attendeeData.length > 0 ? `${attendeeData[0].attendees} attendees` : 'No data'}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="insights-charts-grid">
        {/* Event Showcase Carousel */}
        <div className="insights-chart-card event-carousel-card">
          <h3 className="insights-chart-title">Your Organized Events</h3>
          {organizedEvents.length === 0 ? (
            <div className="event-carousel-empty">
              <p>No events organized yet</p>
            </div>
          ) : (
            <div className="event-carousel-container">
              <button 
                className="carousel-nav-btn carousel-prev" 
                onClick={handlePrevEvent}
                aria-label="Previous event"
              >
                ‹
              </button>
              
              <div className="event-carousel-track">
                {organizedEvents.map((event, index) => {
                  const offset = index - currentEventIndex;
                  const isActive = index === currentEventIndex;
                  
                  return (
                    <div
                      key={event.id}
                      className={`event-carousel-item ${isActive ? 'active' : ''}`}
                      style={{
                        transform: `translateX(${offset * 100}%) scale(${isActive ? 1 : 0.8})`,
                        opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.5,
                        zIndex: isActive ? 10 : 1
                      }}
                    >
                      <div className="event-carousel-image">
                        {event.photo_url ? (
                          <img 
                            src={`${API_BASE_URL}${event.photo_url}`} 
                            alt={event.event_name}
                          />
                        ) : (
                          <div className="event-placeholder-image">
                            <span>📅</span>
                          </div>
                        )}
                        <div className="event-carousel-overlay">
                          <h4 className="event-carousel-title">{event.event_name}</h4>
                          <p className="event-carousel-location">📍 {event.location}</p>
                          <p className="event-carousel-tagline">Let your dreams come true</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                className="carousel-nav-btn carousel-next" 
                onClick={handleNextEvent}
                aria-label="Next event"
              >
                ›
              </button>

              {/* Carousel Indicators */}
              <div className="carousel-indicators">
                {organizedEvents.map((_, index) => (
                  <button
                    key={index}
                    className={`carousel-indicator ${index === currentEventIndex ? 'active' : ''}`}
                    onClick={() => setCurrentEventIndex(index)}
                    aria-label={`Go to event ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Event Attendee Distribution */}
        <div className="insights-chart-card">
          <h3 className="insights-chart-title">Event Attendee Distribution</h3>
          <div className="gender-chart">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : pieSegments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                No attendee data available
              </div>
            ) : (
              <>
                <div className="pie-chart-container">
                  <svg viewBox="0 0 200 200" className="pie-chart-svg">
                    {pieSegments.map((segment, index) => (
                      <circle
                        key={index}
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="40"
                        strokeDasharray={segment.dashArray}
                        transform={`rotate(${segment.startAngle} 100 100)`}
                      />
                    ))}
                  </svg>
                </div>
                <div className="gender-legend">
                  {pieSegments.map((segment, index) => (
                    <div key={index} className="legend-item">
                      <div className="legend-color" style={{ background: segment.color }}></div>
                      <span className="legend-label">
                        {segment.eventName.length > 20 
                          ? segment.eventName.substring(0, 20) + '...' 
                          : segment.eventName}: {segment.attendees} ({segment.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Participants Table */}
      <div className="insights-bottom-section">
        <div className="participants-table-card">
          <h3 className="insights-list-title">Event Participants & Preferences</h3>
          <div className="participants-table-container">
            {participantsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                No participants yet
              </div>
            ) : (
              <table className="participants-table">
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Event</th>
                    <th>Preference</th>
                    <th>Date Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {participantsList.map((participant, index) => (
                    <tr 
                      key={index} 
                      onClick={() => handleRowClick(participant)}
                      style={{ cursor: 'pointer' }}
                      className="participant-row"
                    >
                      <td>
                        <div className="participant-avatar">
                          {participant.profilePicture ? (
                            <img 
                              src={`${API_BASE_URL}${participant.profilePicture}`} 
                              alt={participant.userName}
                              className="avatar-img"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {participant.userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="participant-name">{participant.userName}</td>
                      <td className="participant-email">{participant.userEmail}</td>
                      <td className="participant-event">{participant.eventName}</td>
                      <td>
                        <span className={`preference-badge ${participant.interestLevel}`}>
                          {participant.interestLevel === 'going' ? '✓ Going' : 
                           participant.interestLevel === 'interested' ? '★ Interested' : 
                           '✗ Not Interested'}
                        </span>
                      </td>
                      <td className="participant-date">
                        {new Date(participant.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Event Interest Participation */}
        <div className="insights-list-card">
          <h3 className="insights-list-title">Event interested people</h3>
          <div className="insights-list">
            {interestedData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                No interested participants yet
              </div>
            ) : (
              interestedData.map((event, index) => (
                <div key={event.id} className="insight-list-item">
                  <span className="insight-rank">{index + 1}</span>
                  <span className="insight-label" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.eventName}
                  </span>
                  <div className="insight-bar-track">
                    <div
                      className="insight-bar-fill"
                      style={{ width: `${(event.interestedCount / maxInterested) * 100}%` }}
                    ></div>
                  </div>
                  <span className="insight-value">{event.interestedCount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div className="profile-modal-overlay" onClick={closeProfileModal}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="profile-modal-close" onClick={closeProfileModal}>×</button>
            
            <div className="profile-modal-header">
              <div className="profile-modal-avatar">
                {selectedProfile.profilePicture ? (
                  <img 
                    src={`${API_BASE_URL}${selectedProfile.profilePicture}`} 
                    alt={selectedProfile.userName}
                    className="profile-avatar-large"
                  />
                ) : (
                  <div className="profile-avatar-placeholder-large">
                    {selectedProfile.userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="profile-modal-name">{selectedProfile.userName}</h2>
              <p className="profile-modal-email">{selectedProfile.userEmail}</p>
            </div>

            <div className="profile-modal-body">
              <div className="profile-info-row">
                <span className="profile-info-label">Event:</span>
                <span className="profile-info-value">{selectedProfile.eventName}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label">Preference:</span>
                <span className={`preference-badge ${selectedProfile.interestLevel}`}>
                  {selectedProfile.interestLevel === 'going' ? '✓ Going' : 
                   selectedProfile.interestLevel === 'interested' ? '★ Interested' : 
                   '✗ Not Interested'}
                </span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label">Joined:</span>
                <span className="profile-info-value">
                  {new Date(selectedProfile.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendeeInsights;
