import React, { useState, useEffect } from 'react';
import '../Dashboard/BrowseEvents.css';
import { API_BASE_URL, STORAGE_KEYS } from '../../config';
import Swal from 'sweetalert2';

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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userInterest, setUserInterest] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    accountNumber: '',
    accountName: '',
    bankName: '',
    referenceNumber: '',
    paymentSlip: null
  });
  const [cardDetails, setCardDetails] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardType: '',
    bankName: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  const handleViewDetails = async (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);

    if (currentUser) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user-interests/${currentUser.id}/${event.id}`);
        if (response.ok) {
          const interest = await response.json();
          setUserInterest(interest ? interest.interest_level : null);
        }
      } catch (error) {
        console.error('Error fetching user interest:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedEvent(null);
    setUserInterest(null);
  };

  const handleInterestChange = async (interestLevel) => {
    if (!currentUser || !selectedEvent) return;

    if (interestLevel === 'going') {
      setShowPaymentModal(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user-interests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          event_id: selectedEvent.id,
          interest_level: interestLevel
        })
      });

      if (response.ok) {
        setUserInterest(interestLevel);
        const interestMessages = {
          'interested': 'Marked as Interested! 🌟',
          'not_interested': 'Marked as Not Interested'
        };
        Swal.fire({
          icon: 'success',
          title: interestMessages[interestLevel],
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error updating interest:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update interest. Please try again.'
      });
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'bank') {
      if (!paymentDetails.accountNumber || !paymentDetails.accountName || 
          !paymentDetails.bankName || !paymentDetails.referenceNumber) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Please fill in all bank transfer details'
        });
        return;
      }
    } else if (paymentMethod === 'card') {
      if (!cardDetails.cardHolderName || !cardDetails.cardNumber || 
          !cardDetails.expiryMonth || !cardDetails.expiryYear || 
          !cardDetails.cvv || !cardDetails.cardType || !cardDetails.bankName) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Please fill in all card details'
        });
        return;
      }

      const cardNum = cardDetails.cardNumber.replace(/\s/g, '');
      if (cardNum.length !== 16) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Card',
          text: 'Card number must be 16 digits'
        });
        return;
      }

      if (cardDetails.cvv.length !== 3) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid CVV',
          text: 'CVV must be 3 digits'
        });
        return;
      }
    }

    setIsProcessingPayment(true);

    try {

      const interestResponse = await fetch(`${API_BASE_URL}/api/user-interests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          event_id: selectedEvent.id,
          interest_level: 'going'
        })
      });

      if (!interestResponse.ok) {
        throw new Error('Failed to register for event');
      }

      const paymentData = {
        user_id: currentUser.id,
        event_id: selectedEvent.id,
        amount: selectedEvent.ticket_price,
        payment_date: new Date().toISOString(),
        payment_method: paymentMethod
      };

      if (paymentMethod === 'bank') {
        Object.assign(paymentData, {
          account_number: paymentDetails.accountNumber,
          account_name: paymentDetails.accountName,
          bank_name: paymentDetails.bankName,
          reference_number: paymentDetails.referenceNumber
        });
      } else if (paymentMethod === 'card') {
        Object.assign(paymentData, {
          card_holder_name: cardDetails.cardHolderName,
          card_number: cardDetails.cardNumber.replace(/\s/g, '').slice(-4),
          card_type: cardDetails.cardType,
          bank_name: cardDetails.bankName,
          reference_number: `CARD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });
      }

      const paymentResponse = await fetch(`${API_BASE_URL}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (paymentResponse.ok) {
        setUserInterest('going');
        setShowPaymentModal(false);
        setPaymentMethod('');
        setPaymentDetails({
          accountNumber: '',
          accountName: '',
          bankName: '',
          referenceNumber: '',
          paymentSlip: null
        });
        setCardDetails({
          cardHolderName: '',
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          cardType: '',
          bankName: ''
        });
        
        const successMessage = paymentMethod === 'card' 
          ? '<p>Payment processed successfully!</p><p>You are now registered for this event.</p>'
          : '<p>You are now registered for this event.</p><p>Your payment is being verified and you will receive confirmation shortly.</p>';

        Swal.fire({
          icon: 'success',
          title: 'Payment Submitted Successfully! 🎉',
          html: successMessage,
          confirmButtonText: 'OK',
          confirmButtonColor: '#1e293b'
        });
      } else {
        throw new Error('Payment recording failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: 'Failed to process payment. Please try again or contact support.',
        confirmButtonColor: '#1e293b'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentMethod('');
    setPaymentDetails({
      accountNumber: '',
      accountName: '',
      bankName: '',
      referenceNumber: '',
      paymentSlip: null
    });
    setCardDetails({
      cardHolderName: '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardType: '',
      bankName: ''
    });
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const renderEventCard = (event, index) => {
    const isMyEvent = currentUser && event.organizer_id === currentUser.id;
    
    return (
      <div 
        key={event.id} 
        className="event-card-browse"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="event-card-image">
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
          <span className={`event-badge-browse badge-${event.event_category}`}>
            {event.event_category}
          </span>
          <span className="event-price">${event.ticket_price === 0 || event.ticket_price === '0' ? '0' : event.ticket_price}</span>
          {isMyEvent && (
            <span className="your-event-badge">Your Event</span>
          )}
        </div>
        <div className="event-card-content">
          <div className="event-header-row">
            <h3 className="event-card-title">{event.event_name}</h3>
            <div className="event-rating">
              <span className="star">⭐</span>
              <span>4.8</span>
            </div>
          </div>
          <p className="event-card-description">
            {event.event_name} - Capacity: {event.booked || 0}/{event.capacity}
          </p>
          <div className="event-meta-info">
            <div className="event-meta-item">
              <span className="meta-icon">📅</span>
              <span>{formatDate(event.event_date)} at {formatTime(event.event_time)}</span>
            </div>
            <div className="event-meta-item">
              <span className="meta-icon">📍</span>
              <span>{event.location}</span>
            </div>
          </div>
          <button className="view-details-btn" onClick={() => handleViewDetails(event)}>View Details</button>
        </div>
      </div>
    );
  };

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
            <option value="date">Sort by Dat</option>
            <option value="price">Sort by Price</option>
            <option value="capacity">Sort by Capacity</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span>Showing {totalFilteredEvents} of {allEvents.length} events</span>
      </div>

      {/* All Events Grid */}
      {totalFilteredEvents > 0 ? (
        <div className={`events-grid ${viewMode}`}>
          {[...filteredMyEvents, ...filteredOtherEvents].map((event, index) => renderEventCard(event, index))}
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

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div className="event-modal-overlay" onClick={handleCloseModal}>
          <div className="event-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            
            <div className="modal-event-image">
              {selectedEvent.photo_url ? (
                <img src={`${API_BASE_URL}${selectedEvent.photo_url}`} alt={selectedEvent.event_name} />
              ) : (
                <div className="no-image-placeholder-large">
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
              <span className={`event-badge-modal badge-${selectedEvent.event_category}`}>
                {selectedEvent.event_category}
              </span>
            </div>

            <div className="modal-event-details">
              <h2 className="modal-event-title">{selectedEvent.event_name}</h2>
              
              <div className="modal-event-meta">
                <div className="meta-row">
                  <span className="meta-icon">📅</span>
                  <div>
                    <strong>Date & Time</strong>
                    <p>{formatDate(selectedEvent.event_date)} at {formatTime(selectedEvent.event_time)}</p>
                  </div>
                </div>
                
                <div className="meta-row">
                  <span className="meta-icon">📍</span>
                  <div>
                    <strong>Location</strong>
                    <p>{selectedEvent.location}</p>
                  </div>
                </div>
                
                <div className="meta-row">
                  <span className="meta-icon">💰</span>
                  <div>
                    <strong>Ticket Price</strong>
                    <p>${selectedEvent.ticket_price === 0 || selectedEvent.ticket_price === '0' ? 'Free' : selectedEvent.ticket_price}</p>
                  </div>
                </div>
                
                <div className="meta-row">
                  <span className="meta-icon">👥</span>
                  <div>
                    <strong>Capacity</strong>
                    <p>{selectedEvent.booked || 0} / {selectedEvent.capacity} booked</p>
                  </div>
                </div>

                <div className="meta-row">
                  <span className="meta-icon">🏷️</span>
                  <div>
                    <strong>Category</strong>
                    <p style={{ textTransform: 'capitalize' }}>{selectedEvent.event_category}</p>
                  </div>
                </div>
              </div>

              {currentUser && currentUser.id !== selectedEvent.organizer_id && (
                <div className="interest-section">
                  <label htmlFor="interest-select" className="interest-label">
                    <span className="interest-icon">⭐</span>
                    Mark your interest:
                  </label>
                  <select 
                    id="interest-select"
                    className="interest-select"
                    value={userInterest || ''}
                    onChange={(e) => handleInterestChange(e.target.value)}
                  >
                    <option value="">Select your interest...</option>
                    <option value="interested">😊 Interested</option>
                    <option value="not_interested">😐 Not Interested</option>
                    <option value="going">🎉 Going to Attend</option>
                  </select>
                  
                  {userInterest && (
                    <div className="current-interest">
                      Current status: <strong style={{ textTransform: 'capitalize' }}>
                        {userInterest === 'going' ? '🎉 Going' : 
                         userInterest === 'interested' ? '😊 Interested' : 
                         '😐 Not Interested'}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {currentUser && currentUser.id === selectedEvent.organizer_id && (
                <div className="organizer-badge-modal">
                  <span className="organizer-icon">👤</span>
                  You are the organizer of this event
                </div>
              )}

              {!currentUser && (
                <div className="login-prompt">
                  <p>Please log in to mark your interest in this event</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedEvent && (
        <div className="payment-modal-overlay" onClick={handleClosePaymentModal}>
          <div className="payment-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleClosePaymentModal}>×</button>
            
            <div className="payment-modal-header">
              <h2>🎫 Complete Payment</h2>
              <p>Pay for: {selectedEvent.event_name}</p>
            </div>

            <div className="payment-amount-display">
              <span className="amount-label">Total Amount</span>
              <span className="amount-value">LKR {Number(selectedEvent.ticket_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {!paymentMethod && (
              <div className="payment-method-selection">
                <h3>Select Payment Method</h3>
                <div className="payment-methods-grid">
                  <button 
                    type="button"
                    className="payment-method-card"
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="method-icon">💳</div>
                    <h4>Credit / Debit Card</h4>
                    <p>Pay with Visa or Mastercard</p>
                    <div className="card-logos">
                      <span className="card-logo visa">VISA</span>
                      <span className="card-logo mastercard">MasterCard</span>
                    </div>
                  </button>
                  
                  <button 
                    type="button"
                    className="payment-method-card"
                    onClick={() => setPaymentMethod('bank')}
                  >
                    <div className="method-icon">🏦</div>
                    <h4>Bank Transfer</h4>
                    <p>Transfer to our bank account</p>
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <form className="payment-form" onSubmit={handlePaymentSubmit}>
                <div className="payment-form-header">
                  <h3>💳 Card Payment</h3>
                  <button 
                    type="button" 
                    className="change-method-btn"
                    onClick={() => setPaymentMethod('')}
                  >
                    Change Method
                  </button>
                </div>

                <div className="card-type-selection">
                  <label className="card-type-option">
                    <input
                      type="radio"
                      name="cardType"
                      value="visa"
                      checked={cardDetails.cardType === 'visa'}
                      onChange={(e) => setCardDetails({...cardDetails, cardType: e.target.value})}
                      required
                    />
                    <span className="card-type-label">
                      <span className="visa-logo">VISA</span>
                    </span>
                  </label>
                  <label className="card-type-option">
                    <input
                      type="radio"
                      name="cardType"
                      value="mastercard"
                      checked={cardDetails.cardType === 'mastercard'}
                      onChange={(e) => setCardDetails({...cardDetails, cardType: e.target.value})}
                      required
                    />
                    <span className="card-type-label">
                      <span className="mastercard-logo">MasterCard</span>
                    </span>
                  </label>
                </div>

                <div className="payment-form-group">
                  <label>Issuing Bank *</label>
                  <select
                    value={cardDetails.bankName}
                    onChange={(e) => setCardDetails({...cardDetails, bankName: e.target.value})}
                    required
                  >
                    <option value="">Select your bank</option>
                    <option value="NSB (National Savings Bank)">NSB (National Savings Bank)</option>
                    <option value="Commercial Bank">Commercial Bank</option>
                    <option value="People's Bank"></option>
                    <option value="Bank of Ceylon">Bank of Ceylon</option>
                    <option value="Sampath Bank">Sampath Bank</option>
                    <option value="Hatton National Bank">Hatton National Bank (HNB)</option>
                    <option value="Nations Trust Bank">Nations Trust Bank (NTB)</option>
                    <option value="DFCC Bank">DFCC Bank</option>
                    <option value="Seylan Bank">Seylan Bank</option>
                    <option value="Pan Asia Bank">Pan Asia Bank</option>
                    <option value="Union Bank">Union Bank</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="payment-form-group">
                  <label>Card Holder's Name *</label>
                  <input
                    type="text"
                    placeholder="A M P De Silva"
                    value={cardDetails.cardHolderName}
                    onChange={(e) => setCardDetails({...cardDetails, cardHolderName: e.target.value.toUpperCase()})}
                    required
                  />
                </div>

                <div className="payment-form-group">
                  <label>Card Number *</label>
                  <input
                    type="text"
                    placeholder="4216 **** **** 5896"
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({...cardDetails, cardNumber: formatCardNumber(e.target.value)})}
                    maxLength="19"
                    required
                  />
                </div>

                <div className="payment-form-row">
                  <div className="payment-form-group">
                    <label>Expiry *</label>
                    <div className="expiry-inputs">
                      <input
                        type="text"
                        placeholder="MM"
                        value={cardDetails.expiryMonth}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 2 && (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12))) {
                            setCardDetails({...cardDetails, expiryMonth: val});
                          }
                        }}
                        maxLength="2"
                        required
                      />
                      <span className="expiry-separator">/</span>
                      <input
                        type="text"
                        placeholder="YY"
                        value={cardDetails.expiryYear}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 2) {
                            setCardDetails({...cardDetails, expiryYear: val});
                          }
                        }}
                        maxLength="2"
                        required
                      />
                    </div>
                  </div>

                  <div className="payment-form-group">
                    <label>CVV *</label>
                    <input
                      type="password"
                      placeholder="379"
                      value={cardDetails.cvv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 3) {
                          setCardDetails({...cardDetails, cvv: val});
                        }
                      }}
                      maxLength="3"
                      required
                    />
                  </div>
                </div>

                <div className="payment-actions">
                  <button 
                    type="button" 
                    className="payment-cancel-btn"
                    onClick={handleClosePaymentModal}
                    disabled={isProcessingPayment}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="payment-submit-btn"
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? 'Processing...' : `Pay LKR ${Number(selectedEvent.ticket_price).toFixed(2)}`}
                  </button>
                </div>

                <div className="payment-security-notice">
                  <p>🔒 Your payment information is secure and encrypted</p>
                </div>
              </form>
            )}

            {paymentMethod === 'bank' && (
              <div className="bank-transfer-section">
                <div className="payment-form-header">
                  <h3>🏦 Bank Transfer</h3>
                  <button 
                    type="button" 
                    className="change-method-btn"
                    onClick={() => setPaymentMethod('')}
                  >
                    Change Method
                  </button>
                </div>

                <div className="bank-info-box">
                  <h4>Transfer to this account:</h4>
                  <div className="bank-info-row">
                    <span className="info-label">Bank Name:</span>
                    <span className="info-value">Commercial Bank of Ceylon</span>
                  </div>
                  <div className="bank-info-row">
                    <span className="info-label">Account Name:</span>
                    <span className="info-value">EventDash Payments</span>
                  </div>
                  <div className="bank-info-row">
                    <span className="info-label">Account Number:</span>
                    <span className="info-value">8001234567890</span>
                  </div>
                  <div className="bank-info-row">
                    <span className="info-label">Branch:</span>
                    <span className="info-value">Colombo Main Branch</span>
                  </div>
                </div>

                <form className="payment-form" onSubmit={handlePaymentSubmit}>
                  <p className="payment-instructions">
                    After transferring, please fill in your payment details below:
                  </p>

                  <div className="payment-form-group">
                    <label>Your Bank Name *</label>
                    <select
                      value={paymentDetails.bankName}
                      onChange={(e) => setPaymentDetails({...paymentDetails, bankName: e.target.value})}
                      required
                    >
                      <option value="">Select your bank</option>
                      <option value="NSB (National Savings Bank)">NSB (National Savings Bank)</option>
                      <option value="Commercial Bank">Commercial Bnk</option>
                      <option value="People's Bank">People's Bank</option>
                      <option value="Bank of Ceylon">Bank of Ceylon</option>
                      <option value="Sampath Bank">Sampath Bank</option>
                      <option value="Hatton National Bank">Hatton National Bank (HNB)</option>
                      <option value="Nations Trust Bank">Nations Trust Bank (NTB)</option>
                      <option value="DFCC Bank">DFCC Bank</option>
                      <option value="Seylan Bank">Seylan Bank</option>
                      <option value="Pan Asia Bank">Pan Asi Bank</option>
                      <option value="Union Bank">Union Bank</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="payment-form-group">
                    <label>Your Account Name *</label>
                    <input
                      type="text"
                      placeholder="Enter account holder name"
                      value={paymentDetails.accountName}
                      onChange={(e) => setPaymentDetails({...paymentDetails, accountName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Your Account Number *</label>
                    <input
                      type="text"
                      placeholder="Enter your account number"
                      value={paymentDetails.accountNumber}
                      onChange={(e) => setPaymentDetails({...paymentDetails, accountNumber: e.target.value})}
                      required
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Transaction Reference Number *</label>
                    <input
                      type="text"
                      placeholder="Enter transaction/reference number"
                      value={paymentDetails.referenceNumber}
                      onChange={(e) => setPaymentDetails({...paymentDetails, referenceNumber: e.target.value})}
                      required
                    />
                    <small>Enter the reference number from your bank transfer</small>
                  </div>

                  <div className="payment-actions">
                    <button 
                      type="button" 
                      className="payment-cancel-btn"
                      onClick={handleClosePaymentModal}
                      disabled={isProcessingPayment}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="payment-submit-btn"
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </div>

                  <div className="payment-notice">
                    <p>⚠️ Your registration will be confirmed after payment verification (usually within 24 hours)</p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseEvents;
