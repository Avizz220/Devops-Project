require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initDB, pool, config } = require('./db');

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*', // In production, specify your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'profile_picture' ? 'profile-' : 'event-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    // Initialize database and tables
    const dbInitialized = await initDB();

    // Root route
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Community Events Platform API', 
        status: 'running',
        endpoints: ['/api/auth/signup', '/api/auth/login', '/api/ping', '/api/health']
      });
    });

    // Signup
    app.post('/api/auth/signup', async (req, res) => {
      try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });

        const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length) return res.status(400).json({ error: 'Email already registered' });

        const hashed = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', [name, email, hashed, role]);

        res.json({ id: result.insertId, name, email, role });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Login
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        // Return basic user info including profile picture
        res.json({ 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          profile_picture: user.profile_picture,
          created_at: user.created_at
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Reset password - verifies current password then updates to new hashed password
    app.put('/api/auth/reset-password', async (req, res) => {
      try {
        const { userId, currentPassword, newPassword } = req.body;
        if (!userId || !currentPassword || !newPassword) {
          return res.status(400).json({ error: 'Missing fields' });
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (!rows.length) return res.status(404).json({ error: 'User not found' });

        const user = rows[0];
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

        // Hash new password and update
        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

        res.json({ message: 'Password updated successfully' });
      } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Upload/Update Profile Picture
    app.post('/api/users/:id/profile-picture', upload.single('profile_picture'), async (req, res) => {
      try {
        const { id } = req.params;
        
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        // Check if user exists
        const [existingUser] = await pool.query('SELECT profile_picture FROM users WHERE id = ?', [id]);
        if (!existingUser.length) {
          return res.status(404).json({ error: 'User not found' });
        }

        const profile_picture_url = `/uploads/${req.file.filename}`;

        // Delete old profile picture if it exists
        if (existingUser[0].profile_picture) {
          const oldPhotoPath = path.join(__dirname, existingUser[0].profile_picture);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }

        // Update user's profile picture in database
        await pool.query('UPDATE users SET profile_picture = ? WHERE id = ?', [profile_picture_url, id]);

        res.json({ 
          message: 'Profile picture updated successfully',
          profile_picture: profile_picture_url
        });
      } catch (err) {
        console.error('Error uploading profile picture:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Delete Profile Picture
    app.delete('/api/users/:id/profile-picture', async (req, res) => {
      try {
        const { id } = req.params;
        
        // Get current profile picture
        const [existingUser] = await pool.query('SELECT profile_picture FROM users WHERE id = ?', [id]);
        if (!existingUser.length) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Delete file if it exists
        if (existingUser[0].profile_picture) {
          const photoPath = path.join(__dirname, existingUser[0].profile_picture);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        }

        // Remove profile picture from database
        await pool.query('UPDATE users SET profile_picture = NULL WHERE id = ?', [id]);

        res.json({ message: 'Profile picture removed successfully' });
      } catch (err) {
        console.error('Error removing profile picture:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Update User Profile (name and email)
    app.put('/api/users/:id/profile', async (req, res) => {
      try {
        const { id } = req.params;
        const { name, email } = req.body;

        if (!name || !email) {
          return res.status(400).json({ error: 'Name and email are required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if user exists
        const [existingUser] = await pool.query('SELECT id, email FROM users WHERE id = ?', [id]);
        if (!existingUser.length) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Check if email is already taken by another user
        const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
        if (emailCheck.length > 0) {
          return res.status(400).json({ error: 'Email is already in use by another account' });
        }

        // Update user profile
        await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);

        // Get updated user data
        const [updatedUser] = await pool.query('SELECT id, name, email, role, profile_picture, created_at FROM users WHERE id = ?', [id]);

        res.json({ 
          message: 'Profile updated successfully',
          user: updatedUser[0]
        });
      } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Add a health check endpoint
    app.get('/api/ping', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running' });
    });

    // Add user validation endpoint
    app.get('/api/auth/validate', async (req, res) => {
      try {
        const userId = req.headers['user-id']; // In a real app, use JWT
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        
        const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
        if (!rows.length) return res.status(401).json({ error: 'User not found' });
        
        res.json({ user: rows[0] });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Debug endpoint to view all users (remove in production)
    app.get('/api/debug/users', async (req, res) => {
      try {
        const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json({ users: rows, total: rows.length });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Health check endpoint for Docker
    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Create Event endpoint
    app.post('/api/events', upload.single('photo'), async (req, res) => {
      try {
        const { event_name, event_category, event_date, event_time, location, ticket_price, capacity, organizer_id } = req.body;
        
        if (!event_name || !event_category || !event_date || !event_time || !location || !ticket_price || !capacity || !organizer_id) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await pool.query(
          'INSERT INTO events (event_name, event_category, event_date, event_time, location, ticket_price, capacity, photo_url, organizer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [event_name, event_category, event_date, event_time, location, ticket_price, capacity, photo_url, organizer_id]
        );

        res.status(201).json({ 
          id: result.insertId, 
          event_name,
          event_category,
          event_date, 
          event_time, 
          location, 
          ticket_price, 
          capacity, 
          photo_url,
          organizer_id,
          booked: 0,
          message: 'Event created successfully' 
        });
      } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Get all events for a user (organized by them)
    app.get('/api/events/user/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const [rows] = await pool.query(
          'SELECT * FROM events WHERE organizer_id = ? ORDER BY event_date DESC, event_time DESC',
          [userId]
        );
        console.log(`Fetching events for user ${userId}, found ${rows.length} events`); // Debug log
        res.json(rows); // Return array directly
      } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Get all events
    app.get('/api/events', async (req, res) => {
      try {
        const [rows] = await pool.query(
          'SELECT e.*, u.name as organizer_name FROM events e LEFT JOIN users u ON e.organizer_id = u.id ORDER BY e.event_date DESC, e.event_time DESC'
        );
        res.json(rows); // Return array directly
      } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Get single event by ID
    app.get('/api/events/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const [rows] = await pool.query(
          'SELECT e.*, u.name as organizer_name FROM events e LEFT JOIN users u ON e.organizer_id = u.id WHERE e.id = ?',
          [id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Event not found' });
        res.json(rows[0]);
      } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Update event
    app.put('/api/events/:id', upload.single('photo'), async (req, res) => {
      try {
        const { id } = req.params;
        const { event_name, event_category, event_date, event_time, location, ticket_price, capacity, organizer_id } = req.body;
        
        // Validate required fields
        if (!event_name || !event_category || !event_date || !event_time || !location || !ticket_price || !capacity || !organizer_id) {
          return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if event exists and user owns it
        const [existingEvent] = await pool.query('SELECT * FROM events WHERE id = ? AND organizer_id = ?', [id, organizer_id]);
        if (!existingEvent.length) {
          return res.status(404).json({ error: 'Event not found or unauthorized' });
        }

        // Prepare update query
        let photo_url = existingEvent[0].photo_url;
        if (req.file) {
          photo_url = '/uploads/' + req.file.filename;
          // Delete old photo if it exists
          if (existingEvent[0].photo_url) {
            const oldPhotoPath = path.join(__dirname, existingEvent[0].photo_url);
            if (fs.existsSync(oldPhotoPath)) {
              fs.unlinkSync(oldPhotoPath);
            }
          }
        }

        await pool.query(
          'UPDATE events SET event_name = ?, event_category = ?, event_date = ?, event_time = ?, location = ?, ticket_price = ?, capacity = ?, photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [event_name, event_category, event_date, event_time, location, ticket_price, capacity, photo_url, id]
        );

        res.json({ message: 'Event updated successfully', id });
      } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Delete event
    app.delete('/api/events/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { organizer_id } = req.query;

        if (!organizer_id) {
          return res.status(400).json({ error: 'Organizer ID is required' });
        }

        // Check if event exists and user owns it
        const [existingEvent] = await pool.query('SELECT * FROM events WHERE id = ? AND organizer_id = ?', [id, organizer_id]);
        if (!existingEvent.length) {
          return res.status(404).json({ error: 'Event not found or unauthorized' });
        }

        // Delete photo file if it exists
        if (existingEvent[0].photo_url) {
          const photoPath = path.join(__dirname, existingEvent[0].photo_url);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        }

        await pool.query('DELETE FROM events WHERE id = ?', [id]);
        res.json({ message: 'Event deleted successfully' });
      } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // ====================
    // USER INTERESTS ENDPOINTS
    // ====================

    // Get user's interest for a specific event
    app.get('/api/user-interests/:userId/:eventId', async (req, res) => {
      try {
        const { userId, eventId } = req.params;
        const [interest] = await pool.query(
          'SELECT * FROM user_interests WHERE user_id = ? AND event_id = ?',
          [userId, eventId]
        );
        
        if (interest.length > 0) {
          res.json(interest[0]);
        } else {
          res.json(null);
        }
      } catch (err) {
        console.error('Error fetching user interest:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Get all interests for a user
    app.get('/api/user-interests/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const [interests] = await pool.query(
          'SELECT ui.*, e.event_name, e.event_date, e.event_time, e.location, e.photo_url FROM user_interests ui JOIN events e ON ui.event_id = e.id WHERE ui.user_id = ?',
          [userId]
        );
        res.json(interests);
      } catch (err) {
        console.error('Error fetching user interests:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Set or update user interest for an event
    app.post('/api/user-interests', async (req, res) => {
      try {
        const { user_id, event_id, interest_level } = req.body;

        if (!user_id || !event_id || !interest_level) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate interest level
        const validLevels = ['interested', 'not_interested', 'going'];
        if (!validLevels.includes(interest_level)) {
          return res.status(400).json({ error: 'Invalid interest level' });
        }

        // Check if event exists
        const [event] = await pool.query('SELECT id FROM events WHERE id = ?', [event_id]);
        if (event.length === 0) {
          return res.status(404).json({ error: 'Event not found' });
        }

        // Check if interest already exists
        const [existing] = await pool.query(
          'SELECT id FROM user_interests WHERE user_id = ? AND event_id = ?',
          [user_id, event_id]
        );

        if (existing.length > 0) {
          // Update existing interest
          await pool.query(
            'UPDATE user_interests SET interest_level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND event_id = ?',
            [interest_level, user_id, event_id]
          );
          res.json({ message: 'Interest updated successfully', interest_level });
        } else {
          // Insert new interest
          await pool.query(
            'INSERT INTO user_interests (user_id, event_id, interest_level) VALUES (?, ?, ?)',
            [user_id, event_id, interest_level]
          );
          res.json({ message: 'Interest added successfully', interest_level });
        }
      } catch (err) {
        console.error('Error setting user interest:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Delete user interest for an event
    app.delete('/api/user-interests/:userId/:eventId', async (req, res) => {
      try {
        const { userId, eventId } = req.params;
        await pool.query(
          'DELETE FROM user_interests WHERE user_id = ? AND event_id = ?',
          [userId, eventId]
        );
        res.json({ message: 'Interest removed successfully' });
      } catch (err) {
        console.error('Error deleting user interest:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // ====================
    // PAYMENT ENDPOINTS
    // ====================

    // Submit payment for event
    app.post('/api/payments', async (req, res) => {
      try {
        const { user_id, event_id, account_number, account_name, bank_name, reference_number, amount, payment_date, payment_method } = req.body;

        if (!user_id || !event_id || !bank_name || !reference_number || !amount) {
          return res.status(400).json({ error: 'Missing required payment fields' });
        }

        // Validate payment method
        const validPaymentMethods = ['bank', 'card'];
        const method = payment_method || 'bank';
        if (!validPaymentMethods.includes(method)) {
          return res.status(400).json({ error: 'Invalid payment method' });
        }

        // Check if event exists
        const [event] = await pool.query('SELECT id, ticket_price FROM events WHERE id = ?', [event_id]);
        if (event.length === 0) {
          return res.status(404).json({ error: 'Event not found' });
        }

        // Verify amount matches ticket price
        if (parseFloat(amount) !== parseFloat(event[0].ticket_price)) {
          return res.status(400).json({ error: 'Payment amount does not match ticket price' });
        }

        // Check if payment already exists for this reference number
        const [existing] = await pool.query(
          'SELECT id FROM payments WHERE user_id = ? AND event_id = ? AND reference_number = ?',
          [user_id, event_id, reference_number]
        );

        if (existing.length > 0) {
          return res.status(400).json({ error: 'Payment with this reference number already exists' });
        }

        // Insert payment record
        const [result] = await pool.query(
          'INSERT INTO payments (user_id, event_id, account_number, account_name, bank_name, reference_number, amount, payment_date, payment_status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [user_id, event_id, account_number || null, account_name || null, bank_name, reference_number, amount, payment_date, 'pending', method]
        );

        res.json({ 
          message: method === 'card' ? 'Card payment processed successfully. Awaiting verification.' : 'Payment submitted successfully. Awaiting verification.', 
          payment_id: result.insertId,
          status: 'pending',
          payment_method: method
        });
      } catch (err) {
        console.error('Error submitting payment:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Get user's payments
    app.get('/api/payments/user/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const [payments] = await pool.query(
          `SELECT p.*, e.event_name, e.event_date, e.location 
           FROM payments p 
           JOIN events e ON p.event_id = e.id 
           WHERE p.user_id = ? 
           ORDER BY p.created_at DESC`,
          [userId]
        );
        res.json(payments);
      } catch (err) {
        console.error('Error fetching user payments:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Get payment by event and user
    app.get('/api/payments/:userId/:eventId', async (req, res) => {
      try {
        const { userId, eventId } = req.params;
        const [payment] = await pool.query(
          'SELECT * FROM payments WHERE user_id = ? AND event_id = ? ORDER BY created_at DESC LIMIT 1',
          [userId, eventId]
        );
        
        if (payment.length > 0) {
          res.json(payment[0]);
        } else {
          res.json(null);
        }
      } catch (err) {
        console.error('Error fetching payment:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Verify payment (admin only - you can add auth middleware)
    app.put('/api/payments/:paymentId/verify', async (req, res) => {
      try {
        const { paymentId } = req.params;
        const { verified_by, status, rejection_reason } = req.body;

        if (!['verified', 'rejected'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }

        if (status === 'rejected' && !rejection_reason) {
          return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const updateData = status === 'verified' 
          ? [status, new Date(), verified_by, paymentId]
          : [status, null, verified_by, rejection_reason, paymentId];

        const query = status === 'verified'
          ? 'UPDATE payments SET payment_status = ?, verified_at = ?, verified_by = ? WHERE id = ?'
          : 'UPDATE payments SET payment_status = ?, verified_at = ?, verified_by = ?, rejection_reason = ? WHERE id = ?';

        await pool.query(query, updateData);
        res.json({ message: `Payment ${status} successfully` });
      } catch (err) {
        console.error('Error verifying payment:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT} - http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
