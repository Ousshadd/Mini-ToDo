const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://mini_todo:mini_todo_password@postgres-comments:5432/comments_db',
});

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const initializeDB = async () => {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
          todo_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_comments_todo_user
        ON comments (todo_id, user_id)
      `);

      console.log('Comment-Service PostgreSQL connected and initialized');
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(`PostgreSQL not ready (attempt ${attempt}/${maxAttempts}). Retrying...`);
      await wait(3000);
    }
  }
};

module.exports = { pool, initializeDB };
