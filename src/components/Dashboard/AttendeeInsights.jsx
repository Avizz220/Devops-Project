import React, { useState } from 'react';
import './AttendeeInsights.css';

const AttendeeInsights = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data
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

  // Age distribution data
  const ageDistribution = [
    { range: '18-24', count: 1200 },
    { range: '25-34', count: 2800 },
    { range: '35-44', count: 2000 },
    { range: '45-54', count: 1100 },
    { range: '55+', count: 500 }
  ];

  const maxAge = Math.max(...ageDistribution.map(d => d.count));

  // Gender distribution
  const genderData = {
    female: 52,
    male: 45,
    other: 3
  };

  // Top locations
  const topLocations = [
    { rank: 1, city: 'San Francisco', count: 3200 },
    { rank: 2, city: 'New York', count: 2800 },
    { rank: 3, city: 'Los Angeles', count: 2400 },
    { rank: 4, city: 'Chicago', count: 1800 },
    { rank: 5, city: 'Boston', count: 1200 },
    { rank: 6, city: 'Seattle', count: 1000 }
  ];

  const maxLocation = Math.max(...topLocations.map(l => l.count));

  // Interest categories
  const interestCategories = [
    { rank: 1, category: 'Technology', count: 4200 },
    { rank: 2, category: 'Music', count: 3800 },
    { rank: 3, category: 'Art & Culture', count: 2900 },
    { rank: 4, category: 'Food & Drink', count: 2600 },
    { rank: 5, category: 'Business', count: 2100 },
    { rank: 6, category: 'Sports', count: 1900 }
  ];

  const maxInterest = Math.max(...interestCategories.map(i => i.count));

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
          <div className="stat-card-value">{stats.totalAttendees.toLocaleString()}</div>
          <div className="stat-card-change positive">{stats.totalAttendeesChange}</div>
        </div>

        <div className="insight-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Avg Age</span>
            <span className="stat-card-icon">📅</span>
          </div>
          <div className="stat-card-value">{stats.avgAge}</div>
          <div className="stat-card-unit">{stats.avgAgeUnit}</div>
        </div>

        <div className="insight-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Top Location</span>
            <span className="stat-card-icon">📍</span>
          </div>
          <div className="stat-card-value">{stats.topLocation}</div>
          <div className="stat-card-unit">{stats.topLocationFull}</div>
        </div>

        <div className="insight-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Engagement Rate</span>
            <span className="stat-card-icon">🌐</span>
          </div>
          <div className="stat-card-value">{stats.engagementRate}</div>
          <div className="stat-card-change positive">{stats.engagementChange}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="insights-charts-grid">
        {/* Age Distribution */}
        <div className="insights-chart-card">
          <h3 className="insights-chart-title">Age Distribution</h3>
          <div className="age-chart">
            <div className="age-chart-y-axis">
              <span>2800</span>
              <span>2100</span>
              <span>1400</span>
              <span>700</span>
              <span>0</span>
            </div>
            <div className="age-chart-content">
              {ageDistribution.map((item, index) => (
                <div key={index} className="age-bar-column">
                  <div className="age-bar-wrapper">
                    <div
                      className="age-bar"
                      style={{ height: `${(item.count / maxAge) * 100}%` }}
                    >
                      <div className="age-bar-tooltip">{item.count.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="age-bar-label">{item.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="insights-chart-card">
          <h3 className="insights-chart-title">Gender Distribution</h3>
          <div className="gender-chart">
            <div className="pie-chart-container">
              <svg viewBox="0 0 200 200" className="pie-chart-svg">
                {/* Female - 52% (purple) */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="40"
                  strokeDasharray={`${52 * 5.03} ${100 * 5.03}`}
                  transform="rotate(-90 100 100)"
                />
                {/* Male - 45% (green) */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#6ee7b7"
                  strokeWidth="40"
                  strokeDasharray={`${45 * 5.03} ${100 * 5.03}`}
                  transform="rotate(97 100 100)"
                />
                {/* Other - 3% (yellow) */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#fcd34d"
                  strokeWidth="40"
                  strokeDasharray={`${3 * 5.03} ${100 * 5.03}`}
                  transform="rotate(259 100 100)"
                />
              </svg>
            </div>
            <div className="gender-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#a78bfa' }}></div>
                <span className="legend-label">Female: {genderData.female}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#6ee7b7' }}></div>
                <span className="legend-label">Male: {genderData.male}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#fcd34d' }}></div>
                <span className="legend-label">Other: {genderData.other}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="insights-bottom-grid">
        {/* Top Locations */}
        <div className="insights-list-card">
          <h3 className="insights-list-title">Top Attendee Locations</h3>
          <div className="insights-list">
            {topLocations.map((location) => (
              <div key={location.rank} className="insight-list-item">
                <span className="insight-rank">{location.rank}</span>
                <span className="insight-label">{location.city}</span>
                <div className="insight-bar-track">
                  <div
                    className="insight-bar-fill"
                    style={{ width: `${(location.count / maxLocation) * 100}%` }}
                  ></div>
                </div>
                <span className="insight-value">{location.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interest Categories */}
        <div className="insights-list-card">
          <h3 className="insights-list-title">Interest Categories</h3>
          <div className="insights-list">
            {interestCategories.map((interest) => (
              <div key={interest.rank} className="insight-list-item">
                <span className="insight-rank">{interest.rank}</span>
                <span className="insight-label">{interest.category}</span>
                <div className="insight-bar-track">
                  <div
                    className="insight-bar-fill"
                    style={{ width: `${(interest.count / maxInterest) * 100}%` }}
                  ></div>
                </div>
                <span className="insight-value">{interest.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendeeInsights;
