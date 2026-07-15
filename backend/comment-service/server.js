const express = require('express');
const cors = require('cors');
const { initializeDB } = require('./config/db');
const commentRoutes = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json({ limit: '50kb' }));

app.get('/health', (req, res) => {
  res.json({ service: 'comment-service', status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/', commentRoutes);

initializeDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Comment-Service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`PostgreSQL initialization failed: ${error.message}`);
    process.exit(1);
  });
