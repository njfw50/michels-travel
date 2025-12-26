const FlightService = require('../services/flightService');

class FlightController {
    static async searchFlights(req, res) {
        try {
            const {
                origin,
                destination,
                departureDate,
                returnDate,
                passengers,
                itineraryType = 'ONE_WAY',
                segments,
                infants02,
                children211,
                adults11p,
                fareClass
            } = req.query;

            // Validate required fields conforme tipo
            if (itineraryType === 'MULTI_CITY') {
                if (!segments) {
                    return res.status(400).json({ error: 'Trechos não informados' });
                }
            } else {
                if (!origin || !destination || !departureDate) {
                    return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
                }
            }

            const searchParams = {
                itineraryType,
                passengers: parseInt(passengers) || 1,
                paxBreakdown: {
                    infants02: parseInt(infants02) || 0,
                    children211: parseInt(children211) || 0,
                    adults11p: parseInt(adults11p) || 1,
                },
                fareClass: fareClass || 'ECONOMY'
            };

            if (itineraryType === 'MULTI_CITY') {
                try {
                    const parsed = JSON.parse(segments);
                    searchParams.segments = parsed.map(s => ({
                        origin: String(s.origin || '').toUpperCase(),
                        destination: String(s.destination || '').toUpperCase(),
                        departureDate: s.departureDate
                    }));
                } catch {
                    return res.status(400).json({ error: 'Formato de trechos inválido' });
                }
            } else {
                searchParams.origin = String(origin || '').toUpperCase();
                searchParams.destination = String(destination || '').toUpperCase();
                searchParams.departureDate = departureDate;
                if (itineraryType === 'ROUND_TRIP') {
                    searchParams.returnDate = returnDate;
                }
            }

            const flights = await FlightService.searchFlights(searchParams);
            
            // Format the response
            const formattedFlights = flights.map(flight => ({
                id: flight.itineraryId,
                airline: {
                    name: flight.airline.name,
                    logo: `https://example.com/airline-logos/${flight.airline.code}.png`,
                    code: flight.airline.code
                },
                flightNumber: flight.flightNumber,
                departure: {
                    timestamp: flight.departure.datetime,
                    airport: flight.departure.airportCode,
                    city: flight.departure.cityName
                },
                arrival: {
                    timestamp: flight.arrival.datetime,
                    airport: flight.arrival.airportCode,
                    city: flight.arrival.cityName
                },
                duration: flight.durationMinutes,
                stops: flight.stops.length,
                price: flight.price.amount
            }));

            res.json({
                flights: formattedFlights,
                meta: {
                    total: formattedFlights.length,
                    currency: 'USD',
                    search: {
                        origin: searchParams.origin,
                        destination: searchParams.destination,
                        date: searchParams.departureDate,
                        passengers: searchParams.passengers,
                        paxBreakdown: searchParams.paxBreakdown,
                        fareClass: searchParams.fareClass,
                        itineraryType: searchParams.itineraryType
                    }
                }
            });
        } catch (error) {
            console.error('Erro na busca de voos:', error);
            res.status(500).json({
                error: 'Falha ao buscar voos'
            });
        }
    }
}

module.exports = FlightController;
