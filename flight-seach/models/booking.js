const db = require('../config/database');

class Booking {
    static createTable() {
        return db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                flight_id TEXT NOT NULL,
                passenger_count INTEGER NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                status TEXT NOT NULL,
                payment_id TEXT,
                booking_reference TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        `);
    }

    static createPassengersTable() {
        return db.run(`
            CREATE TABLE IF NOT EXISTS passengers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                date_of_birth DATE NOT NULL,
                passport_number TEXT,
                passenger_type TEXT NOT NULL,
                FOREIGN KEY(booking_id) REFERENCES bookings(id)
            )
        `);
    }
}

module.exports = Booking;
