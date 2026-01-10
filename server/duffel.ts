import axios from "axios";
import { ENV } from "./_core/env";

// Duffel API Configuration - DOGMA 11: Duffel is the canonical flight search API
const DUFFEL_BASE_URL = "https://api.duffel.com";

/**
 * Get Duffel API access token
 * DOGMA 11: Duffel is the official API - validate credentials before use
 */
export async function getDuffelToken(): Promise<string> {
  const apiKey = process.env.DUFFEL_API_KEY;

  if (!apiKey) {
    throw new Error("Duffel API credentials not configured");
  }

  // Duffel uses API key directly, no OAuth token needed
  return apiKey;
}

/**
 * Validate Duffel credentials
 * DOGMA 11: Validate before use
 */
export async function validateDuffelCredentials(): Promise<boolean> {
  try {
    const apiKey = process.env.DUFFEL_API_KEY;
    return !!apiKey;
  } catch {
    return false;
  }
}

// Flight Search Types - DOGMA 11: Duffel API structure
export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  maxPrice?: number;
  // Legacy Amadeus fields for compatibility (will be ignored)
  originLocationCode?: string;
  destinationLocationCode?: string;
  travelClass?: string;
  nonStop?: boolean;
  currencyCode?: string;
  max?: number;
}

export interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  owner: {
    name: string;
    iata_code: string;
  };
}

export interface DuffelSlice {
  origin: {
    iata_code: string;
    name: string;
    city: string;
    city_name: string;
  };
  destination: {
    iata_code: string;
    name: string;
    city: string;
    city_name: string;
  };
  segments: DuffelSegment[];
  duration: string;
}

export interface DuffelSegment {
  departing_at: string;
  arriving_at: string;
  origin: {
    iata_code: string;
    name: string;
  };
  destination: {
    iata_code: string;
    name: string;
  };
  marketing_carrier: {
    name: string;
    iata_code: string;
  };
  marketing_carrier_flight_number: string;
  aircraft: {
    name: string;
    id: string;
  };
  duration: string;
  stops?: number;
}

export interface DuffelPassenger {
  type: "adult" | "child" | "infant";
}

export interface FlightSearchResponse {
  data: DuffelOffer[];
  meta?: {
    totalResults?: number;
  };
}

/**
 * Search for flight offers using Duffel API
 * DOGMA 11: Duffel is the canonical API - validate credentials before use
 */
export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
  // DOGMA 11: Validar credenciais antes de fazer chamada
  const apiKey = process.env.DUFFEL_API_KEY;
  
  if (!apiKey) {
    // DOGMA 11: Retornar erro amigável, não lançar exceção não tratada
    throw new Error("Flight search API is not configured. Please configure DUFFEL_API_KEY in your .env file.");
  }

  try {
    // Create offer request
    const offerRequestResponse = await axios.post(
      `${DUFFEL_BASE_URL}/air/offer_requests`,
      {
        data: {
          slices: [
            {
              origin: params.origin,
              destination: params.destination,
              departure_date: params.departureDate,
            },
            ...(params.returnDate
              ? [
                  {
                    origin: params.destination,
                    destination: params.origin,
                    departure_date: params.returnDate,
                  },
                ]
              : []),
          ],
          passengers: [
            ...Array(params.adults).fill({ type: "adult" }),
            ...Array(params.children || 0).fill({ type: "child" }),
            ...Array(params.infants || 0).fill({ type: "infant" }),
          ],
          cabin_class: params.cabinClass || "economy",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Duffel-Version": "v1",
          "Content-Type": "application/json",
        },
      }
    );

    const offerRequestId = offerRequestResponse.data.data.id;

    // Get offers
    const offersResponse = await axios.get(
      `${DUFFEL_BASE_URL}/air/offers?offer_request_id=${offerRequestId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Duffel-Version": "v1",
        },
      }
    );

    return {
      data: offersResponse.data.data || [],
      meta: {
        totalResults: offersResponse.data.data?.length || 0,
      },
    };
  } catch (error: any) {
    // DOGMA 11: Tratamento explícito de erros
    if (process.env.NODE_ENV === 'development') {
      console.error("[Duffel API] Flight search error:", error.response?.data || error.message);
    }
    throw new Error(
      error.response?.data?.errors?.[0]?.message || 
      error.response?.data?.errors?.[0]?.detail ||
      "Failed to search flights"
    );
  }
}

// Airport/City Search Types
export interface LocationSearchResult {
  type: string;
  subType: string;
  name: string;
  detailedName: string;
  id: string;
  iataCode: string;
  address: {
    cityName: string;
    cityCode: string;
    countryName: string;
    countryCode: string;
  };
}

/**
 * Static list of major airports as fallback when API is not configured
 * DOGMA 11: Flight Search API Error Prevention - Provide fallback
 */
const STATIC_AIRPORTS: LocationSearchResult[] = [
  { type: "location", subType: "AIRPORT", name: "John F. Kennedy International", detailedName: "John F. Kennedy International Airport", id: "JFK", iataCode: "JFK", address: { cityName: "New York", cityCode: "NYC", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "Los Angeles International", detailedName: "Los Angeles International Airport", id: "LAX", iataCode: "LAX", address: { cityName: "Los Angeles", cityCode: "LAX", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "Chicago O'Hare International", detailedName: "Chicago O'Hare International Airport", id: "ORD", iataCode: "ORD", address: { cityName: "Chicago", cityCode: "CHI", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "Miami International", detailedName: "Miami International Airport", id: "MIA", iataCode: "MIA", address: { cityName: "Miami", cityCode: "MIA", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "Orlando International", detailedName: "Orlando International Airport", id: "MCO", iataCode: "MCO", address: { cityName: "Orlando", cityCode: "ORL", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "Newark Liberty International", detailedName: "Newark Liberty International Airport", id: "EWR", iataCode: "EWR", address: { cityName: "Newark", cityCode: "EWR", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "San Francisco International", detailedName: "San Francisco International Airport", id: "SFO", iataCode: "SFO", address: { cityName: "San Francisco", cityCode: "SFO", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "Dallas/Fort Worth International", detailedName: "Dallas/Fort Worth International Airport", id: "DFW", iataCode: "DFW", address: { cityName: "Dallas", cityCode: "DFW", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "Hartsfield-Jackson Atlanta International", detailedName: "Hartsfield-Jackson Atlanta International Airport", id: "ATL", iataCode: "ATL", address: { cityName: "Atlanta", cityCode: "ATL", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "Seattle-Tacoma International", detailedName: "Seattle-Tacoma International Airport", id: "SEA", iataCode: "SEA", address: { cityName: "Seattle", cityCode: "SEA", countryName: "United States", countryCode: "US" } },
  { type: "location", subType: "AIRPORT", name: "London Heathrow", detailedName: "London Heathrow Airport", id: "LHR", iataCode: "LHR", address: { cityName: "London", cityCode: "LON", countryName: "United Kingdom", countryCode: "GB" } },
  { type: "location", subType: "AIRPORT", name: "Paris Charles de Gaulle", detailedName: "Paris Charles de Gaulle Airport", id: "CDG", iataCode: "CDG", address: { cityName: "Paris", cityCode: "PAR", countryName: "France", countryCode: "FR" } },
  { type: "location", subType: "AIRPORT", name: "Frankfurt am Main", detailedName: "Frankfurt am Main Airport", id: "FRA", iataCode: "FRA", address: { cityName: "Frankfurt", cityCode: "FRA", countryName: "Germany", countryCode: "DE" } },
  { type: "location", subType: "AIRPORT", name: "Dubai International", detailedName: "Dubai International Airport", id: "DXB", iataCode: "DXB", address: { cityName: "Dubai", cityCode: "DXB", countryName: "United Arab Emirates", countryCode: "AE" } },
  { type: "location", subType: "AIRPORT", name: "Tokyo Haneda", detailedName: "Tokyo Haneda Airport", id: "HND", iataCode: "HND", address: { cityName: "Tokyo", cityCode: "TYO", countryName: "Japan", countryCode: "JP" } },
];

/**
 * Filter static airports by keyword
 * DOGMA 11: Provide fallback when API is not available
 */
function getStaticAirports(keyword: string): LocationSearchResult[] {
  const lowerKeyword = keyword.toLowerCase();
  return STATIC_AIRPORTS.filter(airport => 
    airport.iataCode.toLowerCase().includes(lowerKeyword) ||
    airport.name.toLowerCase().includes(lowerKeyword) ||
    airport.address.cityName.toLowerCase().includes(lowerKeyword)
  ).slice(0, 10);
}

/**
 * Search for airports and cities using Duffel API
 * DOGMA 11: Flight Search API Error Prevention - Validate credentials and provide fallback
 */
export async function searchLocations(keyword: string): Promise<LocationSearchResult[]> {
  // DOGMA 11: Validar credenciais antes de fazer chamada
  const apiKey = process.env.DUFFEL_API_KEY;
  
  if (!apiKey) {
    // DOGMA 11: Retornar fallback estático, não lançar erro
    if (process.env.NODE_ENV === 'development') {
      console.debug("[Flight API] Duffel credentials not configured, using static airport list");
    }
    return getStaticAirports(keyword);
  }

  try {
    // Duffel doesn't have a direct airport search endpoint
    // Use places endpoint or fallback to static list
    // For now, use static list as Duffel's API structure is different
    // TODO: Implement Duffel places API when available
    return getStaticAirports(keyword);
  } catch (error: any) {
    // DOGMA 11: Tratamento explícito de erros - usar fallback
    if (process.env.NODE_ENV === 'development') {
      console.error("[Flight API] Location search error:", error.response?.data || error.message);
    }
    // DOGMA 11: Retornar fallback estático em caso de erro
    return getStaticAirports(keyword);
  }
}

// Airline data for display
export const AIRLINE_NAMES: Record<string, string> = {
  AA: "American Airlines",
  UA: "United Airlines",
  DL: "Delta Air Lines",
  WN: "Southwest Airlines",
  B6: "JetBlue Airways",
  AS: "Alaska Airlines",
  NK: "Spirit Airlines",
  F9: "Frontier Airlines",
  G4: "Allegiant Air",
  HA: "Hawaiian Airlines",
  BA: "British Airways",
  LH: "Lufthansa",
  AF: "Air France",
  KL: "KLM",
  IB: "Iberia",
  AZ: "ITA Airways",
  LX: "Swiss International",
  OS: "Austrian Airlines",
  SN: "Brussels Airlines",
  TP: "TAP Air Portugal",
  EI: "Aer Lingus",
  SK: "SAS Scandinavian",
  AY: "Finnair",
  LO: "LOT Polish",
  OK: "Czech Airlines",
  RO: "TAROM",
  JU: "Air Serbia",
  OU: "Croatia Airlines",
  JP: "Adria Airways",
  EK: "Emirates",
  QR: "Qatar Airways",
  EY: "Etihad Airways",
  TK: "Turkish Airlines",
  SV: "Saudia",
  GF: "Gulf Air",
  WY: "Oman Air",
  KU: "Kuwait Airways",
  MS: "EgyptAir",
  ET: "Ethiopian Airlines",
  SA: "South African Airways",
  KQ: "Kenya Airways",
  SQ: "Singapore Airlines",
  CX: "Cathay Pacific",
  QF: "Qantas",
  NZ: "Air New Zealand",
  JL: "Japan Airlines",
  NH: "All Nippon Airways",
  KE: "Korean Air",
  OZ: "Asiana Airlines",
  CI: "China Airlines",
  BR: "EVA Air",
  CZ: "China Southern",
  MU: "China Eastern",
  CA: "Air China",
  HU: "Hainan Airlines",
  MH: "Malaysia Airlines",
  TG: "Thai Airways",
  VN: "Vietnam Airlines",
  GA: "Garuda Indonesia",
  PR: "Philippine Airlines",
  AI: "Air India",
  LA: "LATAM Airlines",
  AV: "Avianca",
  CM: "Copa Airlines",
  AM: "Aeromexico",
  AR: "Aerolineas Argentinas",
  G3: "GOL",
  AD: "Azul Brazilian",
  AC: "Air Canada",
  WS: "WestJet",
  TS: "Air Transat",
  VS: "Virgin Atlantic",
  U2: "easyJet",
  FR: "Ryanair",
  W6: "Wizz Air",
  VY: "Vueling",
  DY: "Norwegian",
  PC: "Pegasus Airlines",
};

/**
 * Get airline name from code
 */
export function getAirlineName(code: string): string {
  return AIRLINE_NAMES[code] || code;
}

/**
 * Format duration from ISO 8601 to readable format
 */
export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  
  if (hours && minutes) {
    return `${hours}h ${minutes}m`;
  } else if (hours) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

