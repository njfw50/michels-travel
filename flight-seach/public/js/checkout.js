document.addEventListener('DOMContentLoaded', () => {
    const stripe = Stripe('your_publishable_key');
    const elements = stripe.elements();
    const card = elements.create('card');
    card.mount('#card-element');

    // Handle form submission
    const form = document.getElementById('bookingForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = form.querySelector('button');
        button.disabled = true;

        try {
            // Create payment method
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: card,
            });

            if (error) {
                throw new Error(error.message);
            }

            // Collect passenger data
            const passengers = [];
            document.querySelectorAll('.passenger-form').forEach(form => {
                passengers.push({
                    firstName: form.querySelector('[name="firstName"]').value,
                    lastName: form.querySelector('[name="lastName"]').value,
                    dateOfBirth: form.querySelector('[name="dateOfBirth"]').value,
                    passportNumber: form.querySelector('[name="passportNumber"]').value,
                    type: form.querySelector('[name="passengerType"]').value
                });
            });

            // Submit booking
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    flightId: sessionStorage.getItem('selectedFlightId'),
                    passengers,
                    paymentMethod: paymentMethod.id,
                    totalPrice: sessionStorage.getItem('totalPrice')
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error);
            }

            // Show success and redirect to confirmation page
            window.location.href = `/booking-confirmation.html?reference=${data.bookingReference}`;
        } catch (error) {
            showError(error.message);
            button.disabled = false;
        }
    });
});

function showError(message) {
    const errorDiv = document.getElementById('card-errors');
    errorDiv.textContent = message;
}

// ... Add more utility functions ...
