const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'user-service', status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`👤 User-Service running on port ${PORT}`);
  });
});
