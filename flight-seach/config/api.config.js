module.exports = {
    // Configurações da API de voos
    flightAPI: {
        baseUrl: process.env.FLIGHT_API_URL || 'https://api.aviationstack.com/v1',
        apiKey: process.env.AVIATION_STACK_API_KEY || 'demo_key',
        timeout: 10000
    },
    
    // Configurações da API de clima
    weatherAPI: {
        baseUrl: process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
        apiKey: process.env.OPENWEATHER_API_KEY || 'demo_key',
        timeout: 5000
    },
    
    // Configurações gerais da API
    general: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100 // máximo 100 requests por IP
        },
        cache: {
            ttl: 3600, // 1 hora
            checkPeriod: 600 // 10 minutos
        }
    }
};
