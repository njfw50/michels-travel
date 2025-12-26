const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/config');

class AuthController {
    static async register(req, res) {
        try {
            const { name, email, password } = req.body;

            // Validate input
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            if (!config.passwordPattern.test(password)) {
                return res.status(400).json({ 
                    error: 'Password must contain at least 8 characters, including uppercase and lowercase letters, numbers, and special characters (@$!%*?&)' 
                });
            }

            // Additional password validation
            const specialChars = password.replace(/[^@$!%*?&#]/g, '');
            
            if (specialChars.length < config.passwordRequirements.minSpecialChars) {
                return res.status(400).json({ 
                    error: `Password must contain at least ${config.passwordRequirements.minSpecialChars} special characters (${config.passwordRequirements.specialChars})`
                });
            }

            // Check if user exists
            const existingUser = await new Promise((resolve, reject) => {
                db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Generate a stronger salt with more rounds
            const salt = await bcrypt.genSalt(config.bcryptRounds);
            // Use a longer hash
            const hashedPassword = await bcrypt.hash(password + salt, config.bcryptRounds);

            // Store hashed password and salt
            db.run(
                'INSERT INTO users (name, email, password, salt) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, salt],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error creating user' });
                    }

                    const token = jwt.sign(
                        { id: this.lastID, email },
                        config.jwtSecret,
                        { expiresIn: config.jwtExpiresIn }
                    );

                    res.status(201).json({
                        message: 'User created successfully',
                        token
                    });
                }
            );
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Get user
            db.get(
                'SELECT * FROM users WHERE email = ?',
                [email],
                async (err, user) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }

                    if (!user) {
                        return res.status(401).json({ error: 'Invalid credentials' });
                    }

                    // Verify password with enhanced security
                    const isValid = await bcrypt.compare(password + user.salt, user.password);
                    
                    // Add brute force protection
                    if (!isValid) {
                        // Implement login attempt tracking here
                        await this.trackFailedLogin(email);
                        return res.status(401).json({ error: 'Invalid credentials' });
                    }

                    // Generate token
                    const token = jwt.sign(
                        { id: user.id, email: user.email },
                        config.jwtSecret,
                        { expiresIn: config.jwtExpiresIn }
                    );

                    res.json({
                        message: 'Login successful',
                        token,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email
                        }
                    });
                }
            );
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Add method to get user profile
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;

            db.get(
                'SELECT id, name, email, created_at FROM users WHERE id = ?',
                [userId],
                (err, user) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }

                    if (!user) {
                        return res.status(404).json({ error: 'User not found' });
                    }

                    res.json({ user });
                }
            );
        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Add method to track failed login attempts
    static async trackFailedLogin(email) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO login_attempts (email, attempt_time) VALUES (?, datetime('now'))`,
                [email],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });
    }
}

module.exports = AuthController;
