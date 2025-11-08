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
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
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

        // Return basic user info (no JWT here)
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      } catch (err) {
        console.error(err);
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

    app.listen(PORT, () => console.log(`Server running on port ${PORT} - http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
