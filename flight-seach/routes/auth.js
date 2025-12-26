const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', auth, AuthController.getProfile);

// Expor histórico do usuário autenticado
router.get('/history', auth, (req, res) => {
    const db = require('../config/database');
    db.all(
        'SELECT method, path, query, user_agent, ip, created_at FROM navigation_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 200',
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Erro ao buscar histórico' });
            res.json({ history: rows });
        }
    );
});
router.get('/check-auth', auth, (req, res) => {
    res.json({ isAuthenticated: true, user: req.user });
});

// Password reset routes
router.post('/forgot-password', async (req, res) => {
    // Implement forgot password functionality
    res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/reset-password', async (req, res) => {
    // Implement password reset functionality
    res.status(501).json({ message: 'Not implemented yet' });
});

// Logout route (client-side only, just for completeness)
router.post('/logout', auth, (req, res) => {
    res.json({ message: 'Logout successful' });
});

module.exports = router;
