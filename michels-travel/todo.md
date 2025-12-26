# Michel's Travel - Project TODO

## Core Features
- [x] Amadeus API integration for flight search
- [x] Flight search engine with origin/destination/dates/passengers
- [x] Passenger types support (adults, children, infants)
- [x] Advanced filtering system (stops, airlines, schedules, duration, fare classes)
- [x] Search results with prices, taxes, schedules, duration, baggage info

## Multilingual Support
- [x] English language support
- [x] Portuguese language support
- [x] Spanish language support
- [x] Language selector component

## Pages & UI
- [x] Elegant homepage with hero section
- [x] About Michel's Travel section
- [x] Services presentation
- [x] Flight search page with results
- [x] Contact page
- [x] Responsive design for all devices

## Lead Conversion System
- [x] Booking request form
- [x] Quote request system
- [x] Email notifications to owner on new leads
- [x] Lead storage in database

## Chatbot
- [x] AI-powered travel chatbot
- [x] Destination information
- [x] Documentation requirements
- [x] Best travel seasons advice
- [x] Flight search assistance

## Technical
- [x] Database schema for leads and searches
- [x] tRPC procedures for all features
- [x] Professional styling with Tailwind
- [x] Error handling and loading states
- [x] Unit tests for core functionality

## Payment System (Square)
- [x] Square integration setup (replacing Stripe)
- [x] Payment schema in database (bookings with Square order ID)
- [x] Checkout page with flight details and passenger info
- [x] Square Payment Links API integration
- [x] Payment processing via Square Checkout
- [x] Webhook endpoint for Square payment events
- [x] Success page after payment with booking details
- [x] Pending/cancel pages for payment states
- [x] Booking history page for users (My Bookings)
- [x] Email notification to owner after successful payment
- [ ] Refund handling system (admin only - future)

## Advanced User System & Flight Data Storage
- [x] Enhanced user profile with traveler information
- [x] Passport and document storage (type, number, expiry, country)
- [x] Frequent flyer programs integration
- [x] Travel preferences (seat, meal, airline preferences)
- [x] Saved travelers (family/companions) management
- [x] Search history with smart recommendations
- [x] Favorite flights and routes (saved routes)
- [x] Price alerts for specific routes
- [x] Price drop notifications system
- [x] User dashboard with travel analytics
- [x] Loyalty points tracking (Bronze, Silver, Gold, Platinum tiers)
- [x] Flight price cache for faster searches (15 min TTL)
- [x] Location cache for airports (24 hour TTL)
- [x] Recent searches quick access
- [x] Popular routes tracking
- [x] Cache statistics monitoring
- [x] Profile page with personal info management
- [x] Preferences page with travel settings
- [x] Price alerts page with create/toggle/delete
- [x] Dashboard with overview, routes, alerts, history tabs
- [x] User menu in navigation header
- [ ] Upcoming trips calendar view (future)
- [ ] Past trips history with receipts (future)
- [ ] Personalized destination recommendations (future)

## Testing
- [x] Amadeus API validation tests
- [x] Square payment integration tests
- [x] User system tests (12 tests)
- [x] Cache system tests (14 tests)
- [x] Lead capture tests (4 tests)
- [x] Flight search tests (2 tests)
- [x] Auth logout tests (1 test)
- [x] All 38 tests passing


## Bugs Reportados
- [x] Aeroportos como Rio, Lisboa, Guarulhos não aparecem na busca (RESOLVIDO - banco de dados local com 250+ aeroportos)
- [x] Melhorar busca de localizações para incluir todos os aeroportos do mundo (RESOLVIDO)
