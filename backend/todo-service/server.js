const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', todoRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'todo-service', status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`📝 Todo-Service running on port ${PORT}`);
  });
});
