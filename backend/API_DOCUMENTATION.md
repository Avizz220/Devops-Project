# Event Management API Documentation

## Base URL
```
http://localhost:4000/api
```

## Events Endpoints

### 1. Create Event
**POST** `/events`

Creates a new event with image upload.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body (FormData):
  - `event_name` (string, required): Name of the event
  - `event_date` (date, required): Event date (YYYY-MM-DD)
  - `event_time` (time, required): Event time (HH:MM)
  - `location` (string, required): Event location
  - `ticket_price` (decimal, required): Ticket price
  - `capacity` (integer, required): Maximum capacity
  - `organizer_id` (integer, required): User ID of the organizer
  - `photo` (file, required): Event image (JPG, PNG, GIF - Max 5MB)

**Response:**
```json
{
  "id": 1,
  "event_name": "Tech Summit 2025",
  "event_date": "2025-12-15",
  "event_time": "10:00:00",
  "location": "Convention Center",
  "ticket_price": 50.00,
  "capacity": 500,
  "photo_url": "/uploads/event-1234567890-123456789.jpg",
  "organizer_id": 1,
  "booked": 0,
  "message": "Event created successfully"
}
```

### 2. Get All Events
**GET** `/events`

Retrieves all events with organizer information.

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "event_name": "Tech Summit 2025",
      "event_date": "2025-12-15",
      "event_time": "10:00:00",
      "location": "Convention Center",
      "ticket_price": 50.00,
      "capacity": 500,
      "booked": 120,
      "photo_url": "/uploads/event-1234567890-123456789.jpg",
      "organizer_id": 1,
      "organizer_name": "John Doe",
      "created_at": "2025-11-08T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 3. Get User Events
**GET** `/events/user/:userId`

Retrieves all events organized by a specific user.

**Parameters:**
- `userId` (path): User ID

**Response:**
```json
{
  "events": [...],
  "total": 5
}
```

### 4. Get Single Event
**GET** `/events/:id`

Retrieves details of a single event.

**Parameters:**
- `id` (path): Event ID

**Response:**
```json
{
  "id": 1,
  "event_name": "Tech Summit 2025",
  "event_date": "2025-12-15",
  "event_time": "10:00:00",
  "location": "Convention Center",
  "ticket_price": 50.00,
  "capacity": 500,
  "booked": 120,
  "photo_url": "/uploads/event-1234567890-123456789.jpg",
  "organizer_id": 1,
  "organizer_name": "John Doe"
}
```

## Database Schema

### Events Table
```sql
CREATE TABLE events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  ticket_price DECIMAL(10, 2) NOT NULL,
  capacity INT NOT NULL,
  photo_url VARCHAR(500),
  organizer_id BIGINT NOT NULL,
  booked INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 404 Not Found
```json
{
  "error": "Event not found"
}
```

### 500 Server Error
```json
{
  "error": "Server error"
}
```

## Image Upload
- Maximum file size: 5MB
- Supported formats: JPG, JPEG, PNG, GIF
- Images are stored in `/backend/uploads/` directory
- Accessible via: `http://localhost:4000/uploads/<filename>`
