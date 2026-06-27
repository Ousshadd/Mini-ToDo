const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// GET / — Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// GET /:id — Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// POST / — Create or sync a user (called by auth-api after registration)
router.post('/', async (req, res) => {
  try {
    const { userId, name, email, role } = req.body;

    let user = await User.findOne({ userId });
    if (user) {
      return res.status(400).json({ message: 'Utilisateur déjà enregistré.' });
    }

    user = new User({ userId, name, email, role: role || 'user' });
    await user.save();

    res.status(201).json({ message: 'Utilisateur enregistré.', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// PUT /:id — Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { name, email, role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.json({ message: 'Utilisateur mis à jour.', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// DELETE /:id — Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ userId: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

module.exports = router;
