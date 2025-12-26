import axios from "axios";
import { ENV } from "./_core/env";
import { cachedFlightSearch, cachedLocationSearch, flightCache, popularRoutesCache } from "./cache";

// Amadeus API Configuration
const AMADEUS_BASE_URL = "https://test.api.amadeus.com"; // Use production URL for live: https://api.amadeus.com

interface AmadeusToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: AmadeusToken | null = null;

/**
 * Get Amadeus API access token with caching
 */
export async function getAmadeusToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }

  const apiKey = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Amadeus API credentials not configured");
  }

  try {
    const response = await axios.post(
      `${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: apiKey,
        client_secret: apiSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    cachedToken = {
      access_token: response.data.access_token,
      expires_at: Date.now() + response.data.expires_in * 1000,
    };

    return cachedToken.access_token;
  } catch (error: any) {
    console.error("Failed to get Amadeus token:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Amadeus API");
  }
}

/**
 * Validate Amadeus credentials by attempting to get a token
 */
export async function validateAmadeusCredentials(): Promise<boolean> {
  try {
    await getAmadeusToken();
    return true;
  } catch {
    return false;
  }
}

// Flight Search Types
export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  nonStop?: boolean;
  currencyCode?: string;
  maxPrice?: number;
  max?: number;
}

export interface FlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: Itinerary[];
  price: Price;
  pricingOptions: PricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: TravelerPricing[];
}

export interface Itinerary {
  duration: string;
  segments: Segment[];
}

export interface Segment {
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  carrierCode: string;
  number: string;
  aircraft: { code: string };
  operating?: { carrierCode: string };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface FlightEndpoint {
  iataCode: string;
  terminal?: string;
  at: string;
}

export interface Price {
  currency: string;
  total: string;
  base: string;
  fees?: { amount: string; type: string }[];
  grandTotal: string;
}

export interface PricingOptions {
  fareType: string[];
  includedCheckedBagsOnly: boolean;
}

export interface TravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: Price;
  fareDetailsBySegment: FareDetails[];
}

export interface FareDetails {
  segmentId: string;
  cabin: string;
  fareBasis: string;
  class: string;
  includedCheckedBags?: { weight?: number; weightUnit?: string; quantity?: number };
}

export interface FlightSearchResponse {
  data: FlightOffer[];
  dictionaries?: {
    locations?: Record<string, { cityCode: string; countryCode: string }>;
    aircraft?: Record<string, string>;
    currencies?: Record<string, string>;
    carriers?: Record<string, string>;
  };
}

/**
 * Search for flight offers using Amadeus API with intelligent caching
 */
export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse & { fromCache?: boolean }> {
  // Use cached search wrapper
  const cacheParams = {
    origin: params.originLocationCode,
    destination: params.destinationLocationCode,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    travelClass: params.travelClass,
  };

  const { data, fromCache } = await cachedFlightSearch(cacheParams, async () => {
    const token = await getAmadeusToken();

  const queryParams: Record<string, string> = {
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: params.adults.toString(),
    currencyCode: params.currencyCode || "USD",
    max: (params.max || 50).toString(),
  };

  if (params.returnDate) {
    queryParams.returnDate = params.returnDate;
  }
  if (params.children) {
    queryParams.children = params.children.toString();
  }
  if (params.infants) {
    queryParams.infants = params.infants.toString();
  }
  if (params.travelClass) {
    queryParams.travelClass = params.travelClass;
  }
  if (params.nonStop) {
    queryParams.nonStop = "true";
  }
  if (params.maxPrice) {
    queryParams.maxPrice = params.maxPrice.toString();
  }

    try {
      const response = await axios.get(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: queryParams,
      });

      return response.data;
    } catch (error: any) {
      console.error("Flight search error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.detail || "Failed to search flights");
    }
  });

  return { ...data, fromCache };
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
 * Search for airports and cities with caching
 */
export async function searchLocations(keyword: string): Promise<LocationSearchResult[]> {
  const { data } = await cachedLocationSearch(keyword, async () => {
    const token = await getAmadeusToken();

    try {
      const response = await axios.get(`${AMADEUS_BASE_URL}/v1/reference-data/locations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          keyword,
          subType: "CITY,AIRPORT",
          "page[limit]": 10,
        },
      });

      return response.data.data || [];
    } catch (error: any) {
      console.error("Location search error:", error.response?.data || error.message);
      return [];
    }
  });

  return data;
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    flightCache: flightCache.getStats(),
    popularRoutes: popularRoutesCache.getTopRoutes(10),
  };
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
