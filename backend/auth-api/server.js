const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'auth-api', status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🔐 Auth-API running on port ${PORT}`);
  });
});
