import { format } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PriceCacheService - Manages pre-computed and runtime price caching
 * 
 * Provides fast ETH price lookups from pre-computed data file,
 * plus in-memory caching for other tokens fetched at runtime.
 */
export class PriceCacheService {
  private static ethPrices: Record<string, number> | null = null;
  private runtimeCache: Map<string, number>;

  constructor() {
    this.runtimeCache = new Map<string, number>();
    
    // Load ETH prices on first instantiation
    if (!PriceCacheService.ethPrices) {
      PriceCacheService.loadEthPrices();
    }
  }

  /**
   * Load pre-computed ETH prices from JSON file
   */
  private static loadEthPrices(): void {
    try {
      const dataPath = path.join(__dirname, '../data/eth-prices.json');
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      PriceCacheService.ethPrices = JSON.parse(fileContent);
      console.log(`✅ Loaded ${Object.keys(PriceCacheService.ethPrices || {}).length} days of ETH price data`);
    } catch (error) {
      console.warn('⚠️  Could not load ETH price cache:', error instanceof Error ? error.message : 'Unknown error');
      PriceCacheService.ethPrices = {};
    }
  }

  /**
   * Get ETH price for a specific date from pre-computed cache
   * @param date - The date to lookup
   * @returns Price in USD, or null if not found
   */
  static getEthPrice(date: Date): number | null {
    if (!PriceCacheService.ethPrices) {
      PriceCacheService.loadEthPrices();
    }
    
    const dateKey = format(date, 'yyyy-MM-dd');
    return PriceCacheService.ethPrices?.[dateKey] || null;
  }

  /**
   * Check if we have a cached ETH price for a specific date
   * @param date - The date to check
   * @returns true if price exists in cache
   */
  static hasPrice(date: Date): boolean {
    if (!PriceCacheService.ethPrices) {
      PriceCacheService.loadEthPrices();
    }
    
    const dateKey = format(date, 'yyyy-MM-dd');
    return dateKey in (PriceCacheService.ethPrices || {});
  }

  /**
   * Get price with runtime caching (for tokens fetched during execution)
   * @param coinId - CoinGecko coin ID
   * @param date - The date for the price
   * @param fetchFn - Function to fetch price if not cached
   * @returns Price in USD
   */
  async getCachedPrice(
    coinId: string,
    date: Date,
    fetchFn: (coinId: string, date: Date) => Promise<number>
  ): Promise<number> {
    const key = `${coinId}:${format(date, 'yyyy-MM-dd')}`;
    
    // Check runtime cache first
    if (this.runtimeCache.has(key)) {
      return this.runtimeCache.get(key)!;
    }
    
    // For ETH, check static cache
    if (coinId === 'ethereum') {
      const cached = PriceCacheService.getEthPrice(date);
      if (cached !== null) {
        this.runtimeCache.set(key, cached);
        return cached;
      }
    }
    
    // Otherwise fetch and cache
    const price = await fetchFn(coinId, date);
    if (price > 0) {
      this.runtimeCache.set(key, price);
    }
    return price;
  }

  /**
   * Clear runtime cache (useful for testing or memory management)
   */
  clearRuntimeCache(): void {
    this.runtimeCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { ethPrices: number; runtimeCache: number } {
    return {
      ethPrices: Object.keys(PriceCacheService.ethPrices || {}).length,
      runtimeCache: this.runtimeCache.size,
    };
  }
}

