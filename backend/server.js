require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { initDB, pool, config } = require('./db');

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*', // In production, specify your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

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

    app.listen(PORT, () => console.log(`Server running on port ${PORT} - http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
