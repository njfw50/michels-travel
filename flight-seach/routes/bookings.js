const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

router.post('/', auth, BookingController.createBooking);
router.get('/:bookingReference', auth, BookingController.getBooking);

module.exports = router;
