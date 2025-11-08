# Event Interest Tracking Feature

## Overview
This feature allows logged-in users to view detailed event information and mark their interest level for events they don't organize.

## Database Schema

### user_interests Table
```sql
CREATE TABLE user_interests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  interest_level ENUM('interested', 'not_interested', 'going') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_event (user_id, event_id)
);
```

## Interest Levels

1. **😊 Interested** - User is interested in the event
2. **😐 Not Interested** - User is not interested in the event
3. **🎉 Going** - User plans to attend the event

## API Endpoints

### 1. Get User Interest for Specific Event
```
GET /api/user-interests/:userId/:eventId
```
**Response:** Returns the user's interest record or null if not set

### 2. Get All Interests for a User
```
GET /api/user-interests/:userId
```
**Response:** Returns array of all user interests with event details

### 3. Set/Update User Interest
```
POST /api/user-interests
Body: {
  user_id: number,
  event_id: number,
  interest_level: 'interested' | 'not_interested' | 'going'
}
```
**Response:** Success message with interest level

### 4. Delete User Interest
```
DELETE /api/user-interests/:userId/:eventId
```
**Response:** Success message

## Frontend Implementation

### BrowseEvents Component Updates

#### New State Variables
- `selectedEvent`: Currently selected event for details view
- `showDetailsModal`: Boolean to control modal visibility
- `userInterest`: Current user's interest level for selected event

#### New Functions

**handleViewDetails(event)**
- Opens the event details modal
- Fetches user's current interest level from database
- Sets the selected event

**handleCloseModal()**
- Closes the modal
- Resets selected event and interest state

**handleInterestChange(interestLevel)**
- Sends POST request to update user interest
- Updates local state
- Shows confirmation message

### Event Details Modal

The modal displays:
- Event image with category badge
- Event name
- Date and time
- Location
- Ticket price
- Capacity (booked/total)
- Category
- Interest dropdown (for non-organizers)
- Organizer badge (if user is organizer)
- Login prompt (if not logged in)

## User Experience Flow

### For Regular Users (Not Organizer)
1. Browse events in grid/list view
2. Click "View Details" button on any event
3. Modal opens with full event information
4. Select interest level from dropdown:
   - "Select your interest..."
   - "😊 Interested"
   - "😐 Not Interested"
   - "🎉 Going to Attend"
5. Interest is saved automatically
6. Current status is displayed below dropdown
7. Can change interest level anytime

### For Event Organizers
1. Browse events (own events have "Your Event" badge)
2. Click "View Details" on any event
3. For own events: See "You are the organizer" message
4. For other events: Can mark interest normally

### For Non-Logged-In Users
1. Browse events publicly
2. Click "View Details"
3. See "Please log in to mark your interest" message
4. Cannot interact with interest dropdown

## Security Features

- User ID validation from session/localStorage
- Event existence verification before saving interest
- Unique constraint prevents duplicate interests
- Foreign key constraints ensure data integrity
- CASCADE delete removes interests when user/event deleted

## Styling

### Modal Design
- Semi-transparent dark overlay
- White rounded card with shadow
- Smooth slide-up animation
- Close button with rotation effect on hover
- Gradient background for interest section
- Responsive design for mobile devices

### Color Scheme
- Primary gradient: Purple (#667eea to #764ba2)
- Success: Green (#10b981)
- Background: Light gray (#f8fafc)
- Text: Dark slate (#1e293b)

## Database Migration

To set up the feature, run:
```bash
cd backend
node run-user-interests-migration.js
```

## Testing Checklist

- [ ] User can view event details by clicking "View Details"
- [ ] Modal displays all event information correctly
- [ ] Interest dropdown only appears for logged-in non-organizers
- [ ] Interest selection saves to database
- [ ] Interest status displays correctly after selection
- [ ] Interest can be updated multiple times
- [ ] Organizer sees appropriate message for own events
- [ ] Non-logged-in users see login prompt
- [ ] Modal closes on overlay click
- [ ] Modal closes on X button click
- [ ] Event images display correctly
- [ ] Date and time formatting is correct
- [ ] Responsive design works on mobile

## Future Enhancements

1. **Email Notifications**
   - Notify users when events they're "going" to are updated
   - Remind users about upcoming events they marked as "going"

2. **Event Recommendations**
   - Suggest events based on user interests
   - Show similar events to those marked as "interested"

3. **Social Features**
   - See who else is going to an event
   - Share interest with friends

4. **Analytics Dashboard**
   - Show organizers interest statistics
   - Display "going" count on event cards
   - Track most popular events

5. **Calendar Integration**
   - Add "going" events to user's calendar
   - Send calendar invites

## File Changes

### Backend Files Modified
- `backend/server.js` - Added 4 new API endpoints for user interests
- `backend/migrations/add_user_interests.sql` - Database migration
- `backend/run-user-interests-migration.js` - Migration runner

### Frontend Files Modified
- `src/components/Dashboard/BrowseEvents.jsx` - Added modal and interest tracking
- `src/components/Dashboard/BrowseEvents.css` - Added modal styles (~300 lines)

## API Error Handling

All endpoints include proper error handling:
- 400: Bad Request (missing fields, invalid interest level)
- 404: Event not found
- 500: Server error (database issues)

Success responses include appropriate messages and data.
