const express = require('express');
const Category = require('../models/Category');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// GET / — Get all categories for current user
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// GET /:id — Get a single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user.id });
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée.' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// POST / — Create a new category
router.post('/', async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    const category = new Category({
      name,
      color,
      icon,
      userId: req.user.id,
    });

    await category.save();
    res.status(201).json({ message: 'Catégorie créée.', category });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// PUT /:id — Update a category
router.put('/:id', async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, color, icon },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée.' });
    }

    res.json({ message: 'Catégorie mise à jour.', category });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

// DELETE /:id — Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée.' });
    }
    res.json({ message: 'Catégorie supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

module.exports = router;
