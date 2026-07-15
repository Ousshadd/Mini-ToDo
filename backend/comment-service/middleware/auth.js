const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mini_todo_secret_key_2024';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
  }

  try {
    req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

module.exports = { authMiddleware };
