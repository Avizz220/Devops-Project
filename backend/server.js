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
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
  limits: { fileSize: 5 * 1024 * 1024 },
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
    const dbInitialized = await initDB();
    
    // PUBLIC endpoint to force database reinitialization
    app.post('/api/init-db', async (req, res) => {
      try {
        console.log('🔄 Manual database initialization triggered...');
        await initDB();
        res.json({ 
          success: true, 
          message: 'Database reinitialized successfully! All tables created.',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Manual DB init failed:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Community Events Platform API', 
        status: 'running',
        endpoints: ['/api/auth/signup', '/api/auth/login', '/api/ping', '/api/health']
      });
    });
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
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
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
        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
        res.json({ message: 'Password updated successfully' });
      } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.post('/api/users/:id/profile-picture', upload.single('profile_picture'), async (req, res) => {
      try {
        const { id } = req.params;
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        const [existingUser] = await pool.query('SELECT profile_picture FROM users WHERE id = ?', [id]);
        if (!existingUser.length) {
          return res.status(404).json({ error: 'User not found' });
        }
        const profile_picture_url = `/uploads/${req.file.filename}`;
        if (existingUser[0].profile_picture) {
          const oldPhotoPath = path.join(__dirname, existingUser[0].profile_picture);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }
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
    app.delete('/api/users/:id/profile-picture', async (req, res) => {
      try {
        const { id } = req.params;
        const [existingUser] = await pool.query('SELECT profile_picture FROM users WHERE id = ?', [id]);
        if (!existingUser.length) {
          return res.status(404).json({ error: 'User not found' });
        }
        if (existingUser[0].profile_picture) {
          const photoPath = path.join(__dirname, existingUser[0].profile_picture);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        }
        await pool.query('UPDATE users SET profile_picture = NULL WHERE id = ?', [id]);
        res.json({ message: 'Profile picture removed successfully' });
      } catch (err) {
        console.error('Error removing profile picture:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.put('/api/users/:id/profile', async (req, res) => {
      try {
        const { id } = req.params;
        const { name, email } = req.body;
        if (!name || !email) {
          return res.status(400).json({ error: 'Name and email are required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
        const [existingUser] = await pool.query('SELECT id, email FROM users WHERE id = ?', [id]);
        if (!existingUser.length) {
          return res.status(404).json({ error: 'User not found' });
        }
        const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
        if (emailCheck.length > 0) {
          return res.status(400).json({ error: 'Email is already in use by another account' });
        }
        await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
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
    app.get('/api/ping', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running' });
    });
    app.get('/api/auth/validate', async (req, res) => {
      try {
        const userId = req.headers['user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
        if (!rows.length) return res.status(401).json({ error: 'User not found' });
        res.json({ user: rows[0] });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/debug/users', async (req, res) => {
      try {
        const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json({ users: rows, total: rows.length });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/health', (req, res) =>  {
      res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });
    app.post('/api/admin/fix-db', async (req, res) => {
      try {
        await initDB();
        res.json({ success: true, message: 'Database reinitialized' });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
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
    app.get('/api/events/user/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const [rows] = await pool.query(
          `SELECT e.*, 
           (SELECT COUNT(*) FROM user_interests ui 
            WHERE ui.event_id = e.id AND ui.interest_level = 'going') as booked
           FROM events e 
           WHERE e.organizer_id = ? 
           ORDER BY e.event_date DESC, e.event_time DESC`,
          [userId]
        );
        console.log(`Fetching events for user ${userId}, found ${rows.length} events`);
        res.json(rows);
      } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/events/user/:userId/overview', async (req, res) => {
      try {
        const { userId } = req.params;
        const [events] = await pool.query(
          'SELECT id, event_name, ticket_price FROM events WHERE organizer_id = ?',
          [userId]
        );
        if (events.length === 0) {
          return res.json([]);
        }
        const eventIds = events.map(e => e.id);
        const placeholders = eventIds.map(() => '?').join(',');
        const [interestCounts] = await pool.query(
          `SELECT event_id, 
            SUM(CASE WHEN interest_level = 'interested' THEN 1 ELSE 0 END) AS interested,
            SUM(CASE WHEN interest_level = 'not_interested' THEN 1 ELSE 0 END) AS not_interested,
            SUM(CASE WHEN interest_level = 'going' THEN 1 ELSE 0 END) AS going
           FROM user_interests 
           WHERE event_id IN (${placeholders})
           GROUP BY event_id`,
          eventIds
        );
        const [revenueData] = await pool.query(
          `SELECT event_id, SUM(amount) AS revenue
           FROM payments 
           WHERE event_id IN (${placeholders}) AND payment_status = 'verified'
           GROUP BY event_id`,
          eventIds
        );
        const overview = events.map(event => {
          const counts = interestCounts.find(c => c.event_id === event.id) || {};
          const revenue = revenueData.find(r => r.event_id === event.id)?.revenue || 0;
          return {
            event_id: event.id,
            event_name: event.event_name,
            ticket_price: event.ticket_price,
            interested: Number(counts.interested || 0),
            not_interested: Number(counts.not_interested || 0),
            going: Number(counts.going || 0),
            revenue: Number(revenue)
          };
        });
        res.json(overview);
      } catch (err) {
        console.error('Error fetching event overview:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/users/:userId/recent-activity', async (req, res) => {
      try {
        const { userId } = req.params;
        const activities = [];
        const [createdEvents] = await pool.query(
          `SELECT id, event_name, created_at 
           FROM events 
           WHERE organizer_id = ? 
           ORDER BY created_at DESC 
           LIMIT 5`,
          [userId]
        );
        createdEvents.forEach(event => {
          activities.push({
            type: 'event_created',
            action: `Created event: ${event.event_name}`,
            timestamp: event.created_at,
            color: '#3b82f6'
          });
        });
        const [interests] = await pool.query(
          `SELECT ui.interest_level, ui.created_at, e.event_name 
           FROM user_interests ui
           JOIN events e ON ui.event_id = e.id
           WHERE ui.user_id = ? 
           ORDER BY ui.created_at DESC 
           LIMIT 5`,
          [userId]
        );
        interests.forEach(interest => {
          let action = '';
          let color = '';
          if (interest.interest_level === 'interested') {
            action = `Marked interested in: ${interest.event_name}`;
            color = '#f59e0b';
          } else if (interest.interest_level === 'going') {
            action = `Marked going to: ${interest.event_name}`;
            color = '#10b981';
          } else if (interest.interest_level === 'not_interested') {
            action = `Marked not interested in: ${interest.event_name}`;
            color = '#ef4444';
          }
          activities.push({
            type: 'interest_marked',
            action,
            timestamp: interest.created_at,
            color
          });
        });
        const [payments] = await pool.query(
          `SELECT p.amount, p.created_at, p.payment_status, e.event_name 
           FROM payments p
           JOIN events e ON p.event_id = e.id
           WHERE p.user_id = ? 
           ORDER BY p.created_at DESC 
           LIMIT 5`,
          [userId]
        );
        payments.forEach(payment => {
          const status = payment.payment_status === 'verified' ? 'Payment verified' : 'Payment pending';
          activities.push({
            type: 'payment',
            action: `${status}: LKR ${payment.amount.toLocaleString()} for ${payment.event_name}`,
            timestamp: payment.created_at,
            color: payment.payment_status === 'verified' ? '#10b981' : '#f59e0b'
          });
        });
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const recentActivities = activities.slice(0, 5);
        const formatTimeAgo = (timestamp) => {
          const now = new Date();
          const then = new Date(timestamp);
          const diffMs = now - then;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          if (diffMins < 60) {
            return diffMins <= 1 ? '1 minute ago' : `${diffMins} minutes ago`;
          } else if (diffHours < 24) {
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
          } else {
            return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
          }
        };
        const formattedActivities = recentActivities.map((activity, index) => ({
          id: index + 1,
          action: activity.action,
          time: formatTimeAgo(activity.timestamp),
          color: activity.color
        }));
        res.json(formattedActivities);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/dashboard/stats/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const [totalEventsResult] = await pool.query('SELECT COUNT(*) as count FROM events');
        const totalEvents = totalEventsResult[0].count;
        const [trendingResult] = await pool.query(
          `SELECT e.event_name, COUNT(ui.id) as interest_count
           FROM events e
           LEFT JOIN user_interests ui ON e.id = ui.event_id AND ui.interest_level = 'interested'
           GROUP BY e.id, e.event_name
           ORDER BY interest_count DESC
           LIMIT 1`
        );
        let trendingEvent = { name: 'No events yet', count: 0 };
        if (trendingResult.length > 0) {
          trendingEvent = {
            name: trendingResult[0].event_name,
            count: trendingResult[0].interest_count || 0
          };
        }
        const [userEventsResult] = await pool.query(
          'SELECT COUNT(*) as count FROM events WHERE organizer_id = ?',
          [userId]
        );
        const userOrganizedEvents = userEventsResult[0].count;
        const [membersResult] = await pool.query(
          'SELECT COUNT(DISTINCT organizer_id) as count FROM events'
        );
        const totalMembers = membersResult[0].count;
        res.json({
          totalEvents,
          trendingEvent,
          userOrganizedEvents,
          totalMembers
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/users/:userId/registration-trend', async (req, res) => {
      try {
        const { userId } = req.params;
        const [userEvents] = await pool.query(
          'SELECT id FROM events WHERE organizer_id = ?',
          [userId]
        );
        if (userEvents.length === 0) {
          return res.json([]);
        }
        const eventIds = userEvents.map(e => e.id);
        const [trendData] = await pool.query(
          `SELECT DATE(ui.created_at) as date, COUNT(*) as count
           FROM user_interests ui
           WHERE ui.event_id IN (?) AND ui.interest_level = 'interested'
           GROUP BY DATE(ui.created_at)
           ORDER BY date ASC`,
          [eventIds]
        );
        const formattedData = trendData.map(item => ({
          date: new Date(item.date).toISOString().split('T')[0],
          count: Number(item.count)
        }));
        if (formattedData.length === 0) {
          return res.json([]);
        }
        const startDate = new Date(formattedData[0].date);
        const endDate = new Date(formattedData[formattedData.length - 1].date);
        const filledData = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const existing = formattedData.find(item => item.date === dateStr);
          filledData.push({
            date: dateStr,
            count: existing ? existing.count : 0
          });
        }
        res.json(filledData);
      } catch (err) {
        console.error('Error fetching registration trend:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/users/:userId/attendee-insights', async (req, res) => {
      const { userId } = req.params;
      try {
        const [events] = await pool.query(
          `SELECT 
            e.id,
            e.event_name as eventName,
            COALESCE(COUNT(ui.user_id), 0) as attendees
          FROM events e
          LEFT JOIN user_interests ui ON e.id = ui.event_id AND ui.interest_level = 'going'
          WHERE e.organizer_id = ?
          GROUP BY e.id, e.event_name
          ORDER BY attendees DESC`,
          [userId]
        );
        const totalAttendees = events.reduce((sum, event) => sum + parseInt(event.attendees), 0);
        res.json({
          eventDistribution: events,
          totalAttendees: totalAttendees
        });
      } catch (err) {
        console.error('Error fetching attendee insights:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/users/:userId/interested-participants', async (req, res) => {
      const { userId } = req.params;
      try {
        const [events] = await pool.query(
          `SELECT 
            e.id,
            e.event_name as eventName,
            COALESCE(COUNT(ui.user_id), 0) as interestedCount
          FROM events e
          LEFT JOIN user_interests ui ON e.id = ui.event_id AND ui.interest_level = 'interested'
          WHERE e.organizer_id = ?
          GROUP BY e.id, e.event_name
          ORDER BY interestedCount DESC`,
          [userId]
        );
        res.json({
          eventInterests: events
        });
      } catch (err) {
        console.error('Error fetching interested participants:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/users/:userId/participants-list', async (req, res) => {
      const { userId } = req.params;
      try {
        const [participants] = await pool.query(
          `SELECT 
            u.id as userId,
            u.name as userName,
            u.email as userEmail,
            u.profile_picture as profilePicture,
            e.id as eventId,
            e.event_name as eventName,
            ui.interest_level as interestLevel,
            ui.created_at as createdAt
          FROM user_interests ui
          JOIN users u ON ui.user_id = u.id
          JOIN events e ON ui.event_id = e.id
          WHERE e.organizer_id = ?
          ORDER BY ui.created_at DESC`,
          [userId]
        );
        res.json({
          participants: participants
        });
      } catch (err) {
        console.error('Error fetching participants list:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/events', async (req, res) => {
      try {
        const [rows] = await pool.query(
          `SELECT e.*, u.name as organizer_name,
           (SELECT COUNT(*) FROM user_interests ui 
            WHERE ui.event_id = e.id AND ui.interest_level = 'going') as booked
           FROM events e 
           LEFT JOIN users u ON e.organizer_id = u.id 
           ORDER BY e.event_date DESC, e.event_time DESC`
        );
        res.json(rows);
      } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.get('/api/events/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const [rows] = await pool.query(
          `SELECT e.*, u.name as organizer_name,
           (SELECT COUNT(*) FROM user_interests ui 
            WHERE ui.event_id = e.id AND ui.interest_level = 'going') as booked
           FROM events e 
           LEFT JOIN users u ON e.organizer_id = u.id 
           WHERE e.id = ?`,
          [id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Event not found' });
        res.json(rows[0]);
      } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ error: 'Server error' });
      }
    });
    app.put('/api/events/:id', upload.single('photo'), async (req, res) => {
      try {
        const { id } = req.params;
        const { event_name, event_category, event_date, event_time, location, ticket_price, capacity, organizer_id } = req.body;
        if (!event_name || !event_category || !event_date || !event_time || !location || !ticket_price || !capacity || !organizer_id) {
          return res.status(400).json({ error: 'All fields are required' });
        }
        const [existingEvent] = await pool.query('SELECT * FROM events WHERE id = ? AND organizer_id = ?', [id, organizer_id]);
        if (!existingEvent.length) {
          return res.status(404).json({ error: 'Event not found or unauthorized' });
        }
        let photo_url = existingEvent[0].photo_url;
        if (req.file) {
          photo_url = '/uploads/' + req.file.filename;
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
    app.delete('/api/events/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { organizer_id } = req.query;
        if (!organizer_id) {
          return res.status(400).json({ error: 'Organizer ID is required' });
        }
        const [existingEvent] = await pool.query('SELECT * FROM events WHERE id = ? AND organizer_id = ?', [id, organizer_id]);
        if (!existingEvent.length) {
          return res.status(404).json({ error: 'Event not found or unauthorized' });
        }
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
    app.post('/api/user-interests', async (req, res) => {
      try {
        const { user_id, event_id, interest_level } = req.body;
        if (!user_id || !event_id || !interest_level) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        const validLevels = ['interested', 'not_interested', 'going'];
        if (!validLevels.includes(interest_level)) {
          return res.status(400).json({ error: 'Invalid interest level' });
        }
        const [event] = await pool.query('SELECT id FROM events WHERE id = ?', [event_id]);
        if (event.length === 0) {
          return res.status(404).json({ error: 'Event not found' });
        }
        const [existing] = await pool.query(
          'SELECT id FROM user_interests WHERE user_id = ? AND event_id = ?',
          [user_id, event_id]
        );
        if (existing.length > 0) {
          await pool.query(
            'UPDATE user_interests SET interest_level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND event_id = ?',
            [interest_level, user_id, event_id]
          );
          res.json({ message: 'Interest updated successfully', interest_level });
        } else {
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
    app.post('/api/payments', async (req, res) => {
      try {
        const { user_id, event_id, account_number, account_name, bank_name, reference_number, amount, payment_date, payment_method } = req.body;
        if (!user_id || !event_id || !bank_name || !reference_number || !amount) {
          return res.status(400).json({ error: 'Missing required payment fields' });
        }
        const validPaymentMethods = ['bank', 'card'];
        const method = payment_method || 'bank';
        if (!validPaymentMethods.includes(method)) {
          return res.status(400).json({ error: 'Invalid payment method' });
        }
        const [event] = await pool.query('SELECT id, ticket_price FROM events WHERE id = ?', [event_id]);
        if (event.length === 0) {
          return res.status(404).json({ error: 'Event not found' });
        }
        if (parseFloat(amount) !== parseFloat(event[0].ticket_price)) {
          return res.status(400).json({ error: 'Payment amount does not match ticket price' });
        }
        const [existing] = await pool.query(
          'SELECT id FROM payments WHERE user_id = ? AND event_id = ? AND reference_number = ?',
          [user_id, event_id, reference_number]
        );
        if (existing.length > 0) {
          return res.status(400).json({ error: 'Payment with this reference number already exists' });
        }
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
