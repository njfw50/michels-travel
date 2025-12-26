const apiConfig = require('../config/api.config');

class FlightService {
    static async searchFlights(params) {
        // Mock expandido para suportar ONE_WAY, ROUND_TRIP e MULTI_CITY
        const now = new Date();
        const sample = (o, d, date, id) => ({
            itineraryId: id,
            airline: { name: "Mock Airlines", code: "MA" },
            flightNumber: "MA" + Math.floor(100 + Math.random() * 900),
            departure: { datetime: new Date(date).toISOString(), airportCode: o, cityName: "Origem" },
            arrival: { datetime: new Date(new Date(date).getTime() + 2*3600*1000).toISOString(), airportCode: d, cityName: "Destino" },
            durationMinutes: 120,
            stops: [],
            price: { amount: 299.99 }
        });

        if (params.itineraryType === 'MULTI_CITY' && Array.isArray(params.segments)) {
            // Retorna um resultado por primeiro segmento
            const s0 = params.segments[0];
            return [ sample(s0.origin, s0.destination, s0.departureDate || now, "MC001") ];
        }

        if (params.itineraryType === 'ROUND_TRIP' && params.returnDate) {
            return [ sample(params.origin, params.destination, params.departureDate || now, "RT001") ];
        }

        // ONE_WAY
        return [ sample(params.origin, params.destination, params.departureDate || now, "OW001") ];
    }

    static formatDate(date) {
        return new Date(date).toISOString().split('T')[0];
    }

    static formatFlightResults(data) {
        // Implement formatting logic based on API response
        return data;
    }
}

module.exports = FlightService;
