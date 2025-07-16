require('dotenv').config();
console.log('Backend server starting up...');
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your_jwt_secret_key') {
  console.error('CRITICAL ERROR: JWT_SECRET is not set or is using the default value. Please set the JWT_SECRET environment variable for security.');
  process.exit(1); // Exit the application
} // Use environment variable in production

const app = express();
const port = 3001;

// Define the rate limiter
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `windowMs` (changed from 5)
	message: 'Too many login/registration attempts from this IP, please try again after 15 minutes',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Add a custom handler to send JSON response
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many login/registration attempts from this IP, please try again after 15 minutes'
        });
    }
});

// --- Multer Setup ---
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- Database Setup ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render's managed Postgres
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        menu TEXT NOT NULL,
        imageUrl TEXT
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        meal_id INTEGER REFERENCES meals(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT,
        UNIQUE(meal_id, user_id)
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_requests (
        id SERIAL PRIMARY KEY,
        request_date TEXT NOT NULL,
        requested_menu TEXT NOT NULL
      );
    `);
    console.log('Database tables created or already exist.');
    app.listen(port, () => {
      console.log(`Backend server listening at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initializeDatabase();



// --- Middleware ---
app.use(cors({
  origin: 'http://YOUR_FRONTEND_IP_OR_DOMAIN' // เปลี่ยน YOUR_FRONTEND_IP_OR_DOMAIN เป็น IP หรือโดเมนจริงของ Frontend
}));
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user;
    next();
  });
};

// Example of a protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// --- API Routes ---

// Test route
app.get('/', (req, res) => {
  res.send('Hello from Backend!');
});

// File Upload API
app.post('/api/upload', (req, res) => {
  upload.single('mealImage')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error('Multer error:', err);
      return res.status(500).json({ error: err.message });
    } else if (err) {
      // An unknown error occurred when uploading.
      console.error('Unknown upload error:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    // Return the URL of the uploaded file
    const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl: imageUrl });
  });
});

// Add a new meal
app.post('/api/meals', async (req, res) => {
  const { date, menu, imageUrl } = req.body;
  if (!date || !menu) {
    return res.status(400).json({ error: 'Date and menu are required.' });
  }

  try {
    const result = await pool.query('INSERT INTO meals (date, menu, imageUrl) VALUES ($1, $2, $3) RETURNING id', [date, menu, imageUrl]);
    res.status(201).json({ message: 'Meal added successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error adding meal:', err.message);
    if (err.code === '23505') { // Unique violation error code for PostgreSQL
      return res.status(409).json({ error: 'มีเมนูสำหรับวันที่นี้อยู่แล้ว' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// Delete a meal
app.delete('/api/meals/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM meals WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Meal not found.' });
    }
    // Reviews are deleted automatically by ON DELETE CASCADE
    res.status(200).json({ message: 'Meal deleted successfully' });
  } catch (err) {
    console.error('Error deleting meal:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Get all meals
app.get('/api/meals', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meals ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting all meals:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Get a meal by date
app.get('/api/meals/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const result = await pool.query('SELECT * FROM meals WHERE date = $1', [date]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Meal not found for this date.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error getting meal by date:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Add a new review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  const { meal_id, rating, comment } = req.body;
  const user_id = req.user.userId; // Get user ID from authenticated token

  if (meal_id === undefined || rating === undefined) {
    return res.status(400).json({ error: 'Meal ID and rating are required.' });
  }

  try {
    // Check if the user has already reviewed this meal
    const existingReview = await pool.query('SELECT * FROM reviews WHERE meal_id = $1 AND user_id = $2', [meal_id, user_id]);
    if (existingReview.rowCount > 0) {
      return res.status(409).json({ error: 'You have already reviewed this meal.' });
    }

    const result = await pool.query('INSERT INTO reviews (meal_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING id', [meal_id, user_id, rating, comment]);
    res.status(201).json({ message: 'Review added successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error adding review:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Get reviews for a specific meal
app.get('/api/reviews/:meal_id', async (req, res) => {
  const { meal_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM reviews WHERE meal_id = $1', [meal_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting reviews for meal:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Add a new menu request
app.post('/api/menu-requests', async (req, res) => {
  const { request_date, requested_menu } = req.body;
  if (!request_date || !requested_menu) {
    return res.status(400).json({ error: 'Request date and requested menu are required.' });
  }

  try {
    const result = await pool.query('INSERT INTO menu_requests (request_date, requested_menu) VALUES ($1, $2) RETURNING id', [request_date, requested_menu]);
    res.status(201).json({ message: 'Menu request added successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error adding menu request:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Get all menu requests
app.get('/api/menu-requests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_requests ORDER BY request_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting all menu requests:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Register API
app.post('/api/register', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters.' });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
    res.status(201).json({ message: 'User registered successfully' }); // Simplified success message
  } catch (err) {
    console.error('Error registering user:', err.message);
    // Always return a generic success message to prevent user enumeration
    res.status(201).json({ message: 'User registered successfully' });
  }
});

// Login API
app.post('/api/login', loginLimiter, async (req, res) => {
  console.log('Login API hit!');
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Invalid username or password.' });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Invalid username or password.' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }
    console.log('Backend: User object from DB:', user);

    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    console.log('Backend: JWT_SECRET value:', JWT_SECRET);
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Backend: Token after jwt.sign:', token);
    console.log('Backend: Generated token:', token);
    console.log('Backend: User ID:', user.id);
    res.status(200).json({ message: 'Logged in successfully', token: token, userId: user.id });
  } catch (err) {
    console.error('Error logging in:', err.message);
    res.status(500).json({ error: 'Error logging in.' });
  }
});