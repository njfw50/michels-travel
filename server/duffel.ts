import axios from "axios";
import { ENV } from "./_core/env";

// Duffel API Configuration - DOGMA 11: Duffel is the canonical flight search API
const DUFFEL_BASE_URL = "https://api.duffel.com";

/**
 * Canonical API version required by Duffel API
 * DOGMA: This version MUST be included in all requests to Duffel API
 * 
 * NOTE: Duffel v1 and date-based versions (e.g., 2023-04-03) are deprecated.
 * All requests MUST use v2.
 */
const DUFFEL_API_VERSION = "v2";

/**
 * Get Duffel API request headers with canonical version
 * DOGMA 11: All Duffel API requests MUST include the Duffel-Version header
 * 
 * This function centralizes header construction to ensure:
 * 1. Authorization header is always present
 * 2. Duffel-Version header is always set to the canonical version
 * 3. Content-Type and Accept headers are properly set
 * 
 * @param apiKey - The Duffel API key (Bearer token)
 * @param additionalHeaders - Optional additional headers to merge
 * @returns Headers object ready for axios/fetch requests
 * @throws Error if apiKey is missing or if Duffel-Version header is missing (defensive guard)
 */
export function getDuffelHeaders(
  apiKey: string,
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  // DOGMA 2: No silent failures - validate API key
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "Duffel API key is required. Please configure DUFFEL_API_KEY in your .env file."
    );
  }

  // Construct canonical headers
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Duffel-Version": DUFFEL_API_VERSION,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  // Merge additional headers if provided
  if (additionalHeaders) {
    Object.assign(headers, additionalHeaders);
  }

  // DEFENSIVE GUARD: Ensure Duffel-Version is always present
  // This prevents accidental removal in future changes
  if (!headers["Duffel-Version"]) {
    throw new Error(
      `[CANONICAL ERROR] Duffel-Version header is missing. ` +
      `All Duffel API requests MUST include 'Duffel-Version: ${DUFFEL_API_VERSION}'. ` +
      `This is a required header and cannot be omitted.`
    );
  }

  // DEV-TIME GUARD: Validate that the version is v2 (required by Duffel API)
  // This prevents accidental use of deprecated versions (v1, 2023-04-03, etc.)
  if (headers["Duffel-Version"] !== DUFFEL_API_VERSION) {
    throw new Error(
      `[CANONICAL ERROR] Invalid Duffel-Version header. ` +
      `Expected '${DUFFEL_API_VERSION}', but got '${headers["Duffel-Version"]}'. ` +
      `Duffel v1 and date-based versions are deprecated. All requests MUST use v2. ` +
      `Please use getDuffelHeaders() to ensure correct version.`
    );
  }

  // Additional validation: Reject any deprecated version formats
  const version = headers["Duffel-Version"];
  if (version === "v1" || version?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error(
      `[CANONICAL ERROR] Deprecated Duffel-Version detected: '${version}'. ` +
      `Duffel v1 and date-based versions (e.g., 2023-04-03) are no longer supported. ` +
      `All requests MUST use 'Duffel-Version: v2'.`
    );
  }

  return headers;
}

/**
 * Get Duffel API access token
 * DOGMA 11: Duffel is the official API - validate credentials before use
 * CANONICAL: Supports environment-based API keys (sandbox/production)
 */
import { decryptSensitiveData, isEncrypted } from "./_core/security";

export async function getDuffelToken(): Promise<string> {
  const squareEnvironment = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
  const isProduction = squareEnvironment === "production";

  // Try environment-specific keys first
  let apiKey: string | undefined;
  if (isProduction) {
    apiKey = process.env.DUFFEL_API_KEY_PRODUCTION || process.env.DUFFEL_API_KEY;
  } else {
    apiKey = process.env.DUFFEL_API_KEY_SANDBOX || process.env.DUFFEL_API_KEY;
  }

  // DOGMA 1: Security First - Decrypt if encrypted
  if (apiKey && isEncrypted(apiKey)) {
    try {
      apiKey = decryptSensitiveData(apiKey);
    } catch (error: any) {
      throw new Error(
        `Failed to decrypt Duffel API key: ${error.message}. ` +
        `Please check your ENCRYPTION_KEY configuration.`
      );
    }
  }

  // Validate key matches environment
  if (apiKey) {
    if (isProduction && apiKey.startsWith("duffel_test_")) {
      throw new Error(
        "Duffel API key mismatch: Production environment requires duffel_live_ key, but duffel_test_ key is configured."
      );
    }
    if (!isProduction && apiKey.startsWith("duffel_live_")) {
      // Warning but allow - user might want to test with live key
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          "[Duffel] Warning: Sandbox environment is using duffel_live_ key. Consider using duffel_test_ for testing."
        );
      }
    }
  }

  if (!apiKey) {
    const envName = isProduction ? "production" : "sandbox";
    throw new Error(
      `Duffel API credentials not configured for ${envName}. ` +
      `Please set DUFFEL_API_KEY_${envName.toUpperCase()} or DUFFEL_API_KEY in your .env file.`
    );
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
    // CANONICAL: Use centralized header function for all Duffel API requests
    const headers = getDuffelHeaders(apiKey);

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
        headers,
      }
    );

    const offerRequestId = offerRequestResponse.data.data.id;

    // Get offers - use same canonical headers
    const offersResponse = await axios.get(
      `${DUFFEL_BASE_URL}/air/offers?offer_request_id=${offerRequestId}`,
      {
        headers,
      }
    );

    return {
      data: offersResponse.data.data || [],
      meta: {
        totalResults: offersResponse.data.data?.length || 0,
      },
    };
  } catch (error: any) {
    // CANONICAL ERROR HANDLING: Preserve error context for proper categorization
    // DOGMA 2: Structured logging with safe diagnostics (no secrets)
    const errorContext = {
      statusCode: error.response?.status,
      errorType: error.constructor?.name || "Unknown",
      hasResponse: !!error.response,
      errorMessage: error.message,
    };
    
    console.error("[Duffel API] Flight search error:", errorContext);

    // Preserve original error structure for proper categorization in router
    const enhancedError = new Error(
      error.response?.data?.errors?.[0]?.message || 
      error.response?.data?.errors?.[0]?.detail ||
      error.message ||
      "Failed to search flights"
    ) as Error & { response?: any; statusCode?: number; code?: string };
    
    // Attach response and status code for proper error categorization
    enhancedError.response = error.response;
    enhancedError.statusCode = error.response?.status;
    enhancedError.code = error.code; // Network error codes (ECONNREFUSED, etc.)
    
    throw enhancedError;
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

// Order Creation Types - DOGMA 11: Duffel API v2 structure
export interface PassengerDetail {
  type: "adult" | "child" | "infant";
  given_name: string;
  family_name: string;
  born_on?: string; // YYYY-MM-DD
  gender?: "m" | "f";
  title?: "mr" | "ms" | "mrs" | "miss";
  email?: string;
  phone_number?: string;
  identity_documents?: Array<{
    type: "passport" | "identity_card" | "driving_licence";
    unique_identifier?: string;
    issuing_country_code?: string;
    expires_on?: string; // YYYY-MM-DD
  }>;
}

export interface CreateOrderParams {
  offerId: string;
  passengers: PassengerDetail[];
  services?: Array<{
    id: string;
    quantity: number;
  }>;
}

export interface DuffelOrder {
  id: string;
  offer_id: string;
  status: string;
  total_amount: string;
  total_currency: string;
  slices: DuffelSlice[];
  passengers: Array<{
    id: string;
    type: string;
    given_name: string;
    family_name: string;
  }>;
  created_at: string;
}

export interface CreateOrderResponse {
  data: DuffelOrder;
}

/**
 * Create a flight order using Duffel API v2
 * DOGMA 11: Duffel is the canonical API - validate credentials before use
 */
export async function createOrder(params: CreateOrderParams): Promise<DuffelOrder> {
  const apiKey = process.env.DUFFEL_API_KEY;
  
  if (!apiKey) {
    throw new Error("Flight order API is not configured. Please configure DUFFEL_API_KEY in your .env file.");
  }

  try {
    const headers = getDuffelHeaders(apiKey);

    const orderResponse = await axios.post<CreateOrderResponse>(
      `${DUFFEL_BASE_URL}/air/orders`,
      {
        data: {
          selected_offers: [params.offerId],
          passengers: params.passengers.map(p => ({
            type: p.type,
            given_name: p.given_name,
            family_name: p.family_name,
            ...(p.born_on && { born_on: p.born_on }),
            ...(p.gender && { gender: p.gender }),
            ...(p.title && { title: p.title }),
            ...(p.email && { email: p.email }),
            ...(p.phone_number && { phone_number: p.phone_number }),
            ...(p.identity_documents && p.identity_documents.length > 0 && {
              identity_documents: p.identity_documents.map(doc => ({
                type: doc.type,
                ...(doc.unique_identifier && { unique_identifier: doc.unique_identifier }),
                ...(doc.issuing_country_code && { issuing_country_code: doc.issuing_country_code }),
                ...(doc.expires_on && { expires_on: doc.expires_on }),
              })),
            }),
          })),
          ...(params.services && params.services.length > 0 && {
            services: params.services,
          }),
        },
      },
      {
        headers,
      }
    );

    return orderResponse.data.data;
  } catch (error: any) {
    const errorContext = {
      statusCode: error.response?.status,
      errorType: error.constructor?.name || "Unknown",
      hasResponse: !!error.response,
      errorMessage: error.message,
    };
    
    console.error("[Duffel API] Order creation error:", errorContext);

    const enhancedError = new Error(
      error.response?.data?.errors?.[0]?.message || 
      error.response?.data?.errors?.[0]?.detail ||
      error.message ||
      "Failed to create order"
    ) as Error & { response?: any; statusCode?: number; code?: string };
    
    enhancedError.response = error.response;
    enhancedError.statusCode = error.response?.status;
    enhancedError.code = error.code;
    
    throw enhancedError;
  }
}

