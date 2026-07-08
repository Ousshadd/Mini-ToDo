const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    trim: true,
  },
  color: {
    type: String,
    default: '#6366f1',
    trim: true,
  },
  icon: {
    type: String,
    default: '📁',
    trim: true,
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
categorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

categorySchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Category', categorySchema);
