const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  priority: {
    type: String,
    enum: ['basse', 'moyenne', 'haute'],
    default: 'moyenne',
  },
  status: {
    type: String,
    enum: ['à faire', 'en cours', 'terminé'],
    default: 'à faire',
  },
  dueDate: {
    type: Date,
    default: null,
  },
  categoryId: {
    type: String,
    default: null,
  },
  userId: {
    type: String,
    required: [true, "L'ID utilisateur est requis"],
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
todoSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

todoSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Todo', todoSchema);
