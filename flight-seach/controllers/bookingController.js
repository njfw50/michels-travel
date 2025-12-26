// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class BookingController {
    static async createBooking(req, res) {
        try {
            const {
                flightId,
                passengers,
                paymentMethod,
                totalPrice
            } = req.body;
            const userId = req.user ? req.user.id : 1; // Fallback para teste

            // Generate unique booking reference
            const bookingReference = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // Mock payment intent for demo
            const paymentIntent = {
                id: `pi_${Date.now()}_${Math.floor(Math.random() * 1000)}`
            };

            // Start database transaction
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Create booking
                db.run(
                    `INSERT INTO bookings (
                        user_id, flight_id, passenger_count, 
                        total_price, status, payment_id, booking_reference
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        flightId,
                        passengers.length,
                        totalPrice,
                        'CONFIRMED',
                        paymentIntent.id,
                        bookingReference
                    ],
                    function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to create booking' });
                        }

                        const bookingId = this.lastID;

                        // Insert passengers
                        const stmt = db.prepare(`
                            INSERT INTO passengers (
                                booking_id, first_name, last_name, 
                                date_of_birth, passport_number, passenger_type
                            ) VALUES (?, ?, ?, ?, ?, ?)
                        `);

                        passengers.forEach(passenger => {
                            stmt.run([
                                bookingId,
                                passenger.firstName,
                                passenger.lastName,
                                passenger.dateOfBirth,
                                passenger.passportNumber,
                                passenger.type
                            ]);
                        });

                        stmt.finalize();
                        db.run('COMMIT');

                        // Send confirmation email
                        this.sendBookingConfirmation(userId, bookingReference);

                        res.status(201).json({
                            message: 'Booking confirmed successfully',
                            bookingReference,
                            paymentId: paymentIntent.id
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Booking error:', error);
            res.status(500).json({ error: 'Booking failed' });
        }
    }

    static async getBooking(req, res) {
        const { bookingReference } = req.params;
        const userId = req.user.id;

        db.get(
            `SELECT b.*, GROUP_CONCAT(p.first_name || ' ' || p.last_name) as passenger_names
             FROM bookings b
             LEFT JOIN passengers p ON p.booking_id = b.id
             WHERE b.booking_reference = ? AND b.user_id = ?
             GROUP BY b.id`,
            [bookingReference, userId],
            (err, booking) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch booking' });
                }
                if (!booking) {
                    return res.status(404).json({ error: 'Booking not found' });
                }
                res.json({ booking });
            }
        );
    }

    static async sendBookingConfirmation(userId, bookingReference) {
        // Implement email confirmation logic here
    }
}

module.exports = BookingController;
