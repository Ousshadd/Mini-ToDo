const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', categoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'category-service', status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🏷️ Category-Service running on port ${PORT}`);
  });
});
