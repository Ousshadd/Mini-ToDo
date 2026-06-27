const express = require('express');
const Todo = require('../models/Todo');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// GET / — Get all todos for current user
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// GET /:id — Get a single todo
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
    if (!todo) {
      return res.status(404).json({ message: 'Tâche non trouvée.' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// POST / — Create a new todo
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;

    const todo = new Todo({
      title,
      description,
      userId: req.user.id,
    });

    await todo.save();
    res.status(201).json({ message: 'Tâche créée.', todo });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// PUT /:id — Update a todo
router.put('/:id', async (req, res) => {
  try {
    const { title, description, completed } = req.body;

    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, description, completed },
      { new: true, runValidators: true }
    );

    if (!todo) {
      return res.status(404).json({ message: 'Tâche non trouvée.' });
    }

    res.json({ message: 'Tâche mise à jour.', todo });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// DELETE /:id — Delete a todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!todo) {
      return res.status(404).json({ message: 'Tâche non trouvée.' });
    }
    res.json({ message: 'Tâche supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

module.exports = router;
