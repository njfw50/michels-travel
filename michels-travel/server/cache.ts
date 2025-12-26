/**
 * Intelligent caching system for flight searches
 * Reduces API calls and improves response times
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hitCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  avgHitRate: number;
}

class FlightCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, avgHitRate: 0 };
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 15 * 60 * 1000) { // 15 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate a unique cache key for flight searches
   */
  generateKey(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: string;
  }): string {
    const normalized = {
      o: params.origin.toUpperCase(),
      d: params.destination.toUpperCase(),
      dd: params.departureDate,
      rd: params.returnDate || "",
      a: params.adults,
      c: params.children || 0,
      i: params.infants || 0,
      tc: params.travelClass || "ECONOMY",
    };
    return JSON.stringify(normalized);
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      return null;
    }

    entry.hitCount++;
    this.stats.hits++;
    this.updateHitRate();
    return entry.data as T;
  }

  /**
   * Store data in cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL),
      hitCount: 0,
    });
    this.stats.size = this.cache.size;
  }

  /**
   * Evict the oldest/least used entries
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let lowestHits = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      // Prioritize evicting expired entries
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        continue;
      }

      // Then evict by combination of age and hit count
      const score = entry.hitCount * 1000 - (Date.now() - entry.timestamp);
      if (score < lowestHits || entry.timestamp < oldestTime) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHits = score;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
    this.stats.size = this.cache.size;
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.avgHitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0, avgHitRate: 0 };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    this.stats.size = this.cache.size;
    return removed;
  }
}

// Location cache with longer TTL (airports don't change often)
class LocationCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  generateKey(keyword: string): string {
    return `loc:${keyword.toLowerCase().trim()}`;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) this.cache.delete(key);
      return null;
    }
    entry.hitCount++;
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    if (this.cache.size >= 5000) {
      // Simple eviction: remove first 500 entries
      const keys = Array.from(this.cache.keys()).slice(0, 500);
      keys.forEach(k => this.cache.delete(k));
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.TTL,
      hitCount: 0,
    });
  }
}

// Popular routes cache for pre-warming
class PopularRoutesCache {
  private popularRoutes: Set<string> = new Set();
  private routeSearchCounts: Map<string, number> = new Map();

  recordSearch(origin: string, destination: string): void {
    const key = `${origin}-${destination}`;
    const count = (this.routeSearchCounts.get(key) || 0) + 1;
    this.routeSearchCounts.set(key, count);

    // Add to popular routes if searched more than 5 times
    if (count >= 5) {
      this.popularRoutes.add(key);
    }
  }

  getPopularRoutes(): string[] {
    return Array.from(this.popularRoutes);
  }

  isPopularRoute(origin: string, destination: string): boolean {
    return this.popularRoutes.has(`${origin}-${destination}`);
  }

  getTopRoutes(limit = 20): Array<{ route: string; count: number }> {
    return Array.from(this.routeSearchCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([route, count]) => ({ route, count }));
  }
}

// Export singleton instances
export const flightCache = new FlightCache();
export const locationCache = new LocationCache();
export const popularRoutesCache = new PopularRoutesCache();

// Utility function for cached flight search
export async function cachedFlightSearch<T>(
  params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: string;
  },
  fetchFn: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  const key = flightCache.generateKey(params);
  
  // Try to get from cache first
  const cached = flightCache.get<T>(key);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Cache the result
  // Use shorter TTL for popular routes (they get updated more frequently)
  const isPopular = popularRoutesCache.isPopularRoute(params.origin, params.destination);
  const ttl = isPopular ? 10 * 60 * 1000 : 15 * 60 * 1000; // 10 or 15 minutes
  
  flightCache.set(key, data, ttl);
  
  // Record the search for popularity tracking
  popularRoutesCache.recordSearch(params.origin, params.destination);

  return { data, fromCache: false };
}

// Utility function for cached location search
export async function cachedLocationSearch<T>(
  keyword: string,
  fetchFn: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  const key = locationCache.generateKey(keyword);
  
  const cached = locationCache.get<T>(key);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  const data = await fetchFn();
  locationCache.set(key, data);

  return { data, fromCache: false };
}

// Schedule periodic cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(intervalMs = 5 * 60 * 1000): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const removed = flightCache.cleanup();
    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }
  }, intervalMs);
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
