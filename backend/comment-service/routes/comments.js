const express = require('express');
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const TODO_SERVICE_URL = process.env.TODO_SERVICE_URL || 'http://todo-service:3003';

router.use(authMiddleware);

const serializeComment = (row) => ({
  id: row.id,
  content: row.content,
  todoId: row.todo_id,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const parseCommentId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const verifyTodoOwnership = async (todoId, authorization) => {
  const response = await fetch(`${TODO_SERVICE_URL}/${encodeURIComponent(todoId)}`, {
    headers: { Authorization: authorization },
  });

  if (response.status === 404) return { exists: false };
  if (response.status === 401) return { unauthorized: true };
  if (!response.ok) throw new Error(`Todo service returned HTTP ${response.status}`);
  return { exists: true };
};

// GET /task/:todoId - Get comments for one of the current user's tasks
router.get('/task/:todoId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM comments
       WHERE todo_id = $1 AND user_id = $2
       ORDER BY created_at ASC`,
      [req.params.todoId, req.user.id]
    );

    return res.json(result.rows.map(serializeComment));
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// POST / - Add a comment after verifying that the task belongs to this user
router.post('/', async (req, res) => {
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  const todoId = typeof req.body.todoId === 'string' ? req.body.todoId.trim() : '';

  if (!content || !todoId) {
    return res.status(400).json({ message: 'Le contenu et todoId sont requis.' });
  }

  try {
    const todo = await verifyTodoOwnership(todoId, req.headers.authorization);
    if (todo.unauthorized) {
      return res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
    if (!todo.exists) {
      return res.status(404).json({ message: 'Tâche non trouvée.' });
    }

    const result = await pool.query(
      `INSERT INTO comments (content, todo_id, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [content, todoId, req.user.id]
    );

    return res.status(201).json({
      message: 'Commentaire créé.',
      comment: serializeComment(result.rows[0]),
    });
  } catch (error) {
    const unavailable = error instanceof TypeError || error.message.includes('Todo service');
    return res.status(unavailable ? 503 : 500).json({
      message: unavailable ? 'Le service des tâches est indisponible.' : 'Erreur serveur.',
      error: error.message,
    });
  }
});

// PUT /:id - Update one of the current user's comments
router.put('/:id', async (req, res) => {
  const id = parseCommentId(req.params.id);
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

  if (!id || !content) {
    return res.status(400).json({ message: 'Identifiant ou contenu invalide.' });
  }

  try {
    const result = await pool.query(
      `UPDATE comments
       SET content = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Commentaire non trouvé.' });
    }

    return res.json({
      message: 'Commentaire mis à jour.',
      comment: serializeComment(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// DELETE /:id - Delete one of the current user's comments
router.delete('/:id', async (req, res) => {
  const id = parseCommentId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' });

  try {
    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Commentaire non trouvé.' });
    }

    return res.json({ message: 'Commentaire supprimé.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

module.exports = router;
