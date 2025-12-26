const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const auth = require('../middleware/auth');

// Auth routes
router.use('/auth', authRoutes);

// Protected API routes
router.use('/api', auth, require('./api'));

// Public routes
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling for routes
router.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = router;
