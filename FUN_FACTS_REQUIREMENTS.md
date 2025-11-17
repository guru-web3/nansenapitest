# Fun Facts Requirements Document

## Overview
This document defines the requirements, specifications, and implementation details for all currently active fun facts in the Wallet Analyzer system.

**Last Updated:** November 2025  
**Active Fun Facts:** 5  
**Status:** Production Ready

---

## Active Fun Facts

### 1. P&L (Profit & Loss)

#### Purpose
Analyze the wallet's realized profit or loss over the past year to show overall trading performance.

#### Data Source
- **API:** Nansen API - `getPnlSummary()`
- **Endpoint:** P&L Summary
- **Chain Coverage:** All chains

#### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| Timeframe | 1 year (365 days) | Default lookback period |
| Chain | 'all' | Analyzes across all supported chains |
| Minimum Activity | >$1 USD and >0.01% | Threshold to consider valid data |

#### Calculation Logic
1. Fetch P&L summary for the specified timeframe
2. Extract `realized_pnl_usd` (absolute dollar amount)
3. Extract `realized_pnl_percent` (percentage return)
4. Convert decimal to percentage (e.g., 0.146 → 14.6%)
5. Determine status: GAIN (≥0) or LOSS (<0)

#### Display Format
**Output:**
```
My wallet P&L in the past year:
Up +14.6%
```
or
```
My wallet P&L in the past year:
Down -14.6%
```

**Styling:**
- "Up" displayed in green
- "Down" displayed in red
- Percentage colored based on positive/negative

#### Success Conditions
- Valid P&L data exists (`realized_pnl_usd` is defined)
- Activity threshold met: abs(pnlUsd) >= $1 OR abs(pnlPercent) >= 0.01%

#### Fallback Message
"Only mist—too little history to read."

#### Implementation File
`src/features/pnl.ts`

---

### 2. Win Rate Champion

#### Purpose
Calculate the percentage of profitable trades to measure trading accuracy and success rate.

#### Data Source
- **API:** Nansen API - `getPnlSummary()`
- **Endpoint:** P&L Summary (same as P&L feature)
- **Chain Coverage:** All chains

#### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| Timeframe | 1 year (365 days) | Default lookback period |
| Chain | 'all' | Analyzes across all supported chains |
| Minimum Trades | >0 | Must have at least one completed trade |

#### Calculation Logic
1. Fetch P&L summary data
2. Extract `win_rate` field (decimal format, e.g., 0.75 = 75%)
3. Convert to percentage: `win_rate * 100`
4. Extract `traded_token_count` and `traded_times` for validation
5. Validate that trading activity exists (both counts > 0)

#### Display Format
**Output:**
```
My wallet win rate:
75% Win Rate
```

**Styling:**
- Green if win rate ≥ 50%
- Yellow if win rate < 50%

#### Success Conditions
- `win_rate` field exists in API response
- `traded_token_count` > 0
- `traded_times` > 0

#### Fallback Message
"Not enough trading history to calculate win rate"

#### Implementation File
`src/features/winRate.ts`

#### Notes
- Win rate is count-based: (# of profitable trades / total trades) × 100
- NOT value-weighted (each trade counts equally regardless of size)
- Removed detailed token breakdown for cleaner display

---

### 3. Rugged Projects

#### Purpose
Detect tokens where the user invested significantly but lost 90%+ value while still holding the position, indicating potential rug pulls or scams.

#### Data Sources
- **API 1:** Nansen API - `getCurrentBalance()` (current holdings)
- **API 2:** Nansen API - `getAllTransactions()` (purchase history)
- **Chain Coverage:** 5 major chains (Ethereum, Arbitrum, Polygon, Base, Optimism)

#### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| Lookback Period | 2 years (730 days) | Historical transaction window |
| MIN_INVESTMENT | $100 USD | Minimum initial investment to consider |
| LOSS_THRESHOLD | -90% | Required loss percentage |
| MIN_AGE_DAYS | 30 days | Minimum days since last purchase |
| DEAD_PRICE_THRESHOLD | $0.00001 | Price threshold for "dead" tokens |
| Hold Requirement | 80%+ | Must still hold majority of position |
| Chains | 5 chains | Ethereum, Arbitrum, Polygon, Base, Optimism |

#### Calculation Logic
1. Fetch ALL current holdings (including low-value tokens)
2. Fetch 2 years of transaction history from 5 chains in parallel
3. Build purchase history map:
   - Track tokens received (purchases)
   - Track tokens sent (sales/transfers)
   - Calculate net position: `purchased - sold`
4. For each holding, check 4 rug indicators:
   - ✅ Lost 90%+ of value
   - ✅ 30+ days old
   - ✅ Token price < $0.00001 (effectively dead)
   - ✅ Still holds >80% of position (didn't intentionally exit)
5. Assign confidence score:
   - **HIGH:** All 4 indicators met
   - **MEDIUM:** 3 out of 4 indicators met
   - **LOW:** <3 indicators (not reported)
6. Filter and count HIGH/MEDIUM confidence rugged tokens

#### Display Format
**Output (if rugged tokens found):**
```
I have 2 rugged tokens as my battle scars
```

**Output (if no rugged tokens):**
```
No rugged projects detected—clear skies ahead
```

**Styling:**
- Number displayed in red and bold
- "token" vs "tokens" (proper singular/plural)

#### Success Conditions
- Has current holdings
- Found ≥1 rugged token with MEDIUM or HIGH confidence

#### Fallback Message
"No rugged projects detected—clear skies ahead"

#### Implementation File
`src/features/ruggedProjects.ts`

#### Notes
- Skips native tokens (ETH, etc.) - cannot be rugged
- Ignores airdrops (tokens never purchased)
- Filters out intentional exits (>50% sold)
- Filters out dust positions (<$10 current value)
- Multi-chain parallel fetching for performance

---

### 4. Portfolio at ATH

#### Purpose
Calculate hypothetical portfolio value if all current holdings were at their all-time high prices from the past year.

#### Data Sources
- **API 1:** Nansen API - `getCurrentBalance()` (current holdings)
- **API 2:** CoinGecko API - `batchGetATHPrices()` (historical ATH prices)
- **Chain Coverage:** All chains

#### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| ATH Lookback | 365 days | Period to search for ATH prices |
| Holdings Count | Top 20 | Number of holdings to analyze |
| MIN_VALUE_USD | $50 | Minimum holding value to include |
| Price Source | CoinGecko | Historical price data provider |

#### Calculation Logic
1. Fetch top 20 holdings sorted by USD value (min $50 each)
2. Filter out native tokens (ETH, etc.)
3. Calculate current portfolio value: `sum(holding.value_usd)`
4. For each token:
   - Fetch ATH price from past 365 days via CoinGecko
   - Calculate token amount from balance or `value_usd / price_usd`
   - Calculate ATH value: `token_amount × ath_price`
5. Sum all ATH values to get total ATH portfolio value
6. Calculate potential gain: `((athValue - currentValue) / currentValue) × 100`

#### Display Format
**Output:**
```
If I cashed out my top 20 holdings at ATH:
Up +44%
  ($144K total value)
```

**Styling:**
- "Up" and percentage displayed in green
- USD value shown in dimmed/gray text as supplementary info

#### Success Conditions
- Has holdings with value ≥$50
- Successfully retrieved ATH data for ≥1 token

#### Fallback Message
"No meaningful history yet for young/empty wallets"

#### Implementation File
`src/features/portfolioATH.ts`

#### Rate Limiting Considerations
- CoinGecko free tier: ~10-30 calls/minute
- May encounter 429 errors in multi-wallet analysis
- Consider caching or paid tier for production

---

### 5. ETH Benchmark

#### Purpose
Compare wallet's token trading performance against a simple "buy and hold ETH" strategy.

#### Data Sources
- **API 1:** Nansen API - `getAllTransactions()` (transaction history)
- **API 2:** Local Cache - `eth-prices.json` (historical ETH prices)
- **API 3:** CoinGecko API - `getCurrentPrice()` (current ETH price)
- **Chain Coverage:** 5 major chains (Ethereum, Arbitrum, Polygon, Base, Optimism)

#### Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| Lookback Period | 12 months | Transaction history window |
| MIN_VOLUME_USD | $10 | Minimum transaction volume |
| Transaction Sampling | Top 50 | Sample size for performance (~98% coverage) |
| Chains | 5 chains | Ethereum, Arbitrum, Polygon, Base, Optimism |
| Price Cache | Local file | Pre-generated historical ETH prices |

#### Calculation Logic
1. Fetch 12 months of transactions from 5 chains in parallel
2. Filter for BUY transactions (`tokens_received` > 0)
3. Sort by volume DESC and sample top 50 transactions
4. For each sampled transaction:
   - Get transaction USD value spent
   - Lookup historical ETH price at transaction date (from cache)
   - Calculate ETH equivalent: `usd_spent / eth_price_at_time`
5. Sum total USD spent: `totalUsdSpent`
6. Sum total ETH that could have been bought: `totalEthEquivalent`
7. Get current ETH price from CoinGecko
8. Calculate ETH strategy value: `totalEthEquivalent × currentEthPrice`
9. Calculate difference: `portfolioValue - ethEquivalentValue`
10. Calculate performance: `(difference / ethEquivalentValue) × 100`

#### Display Format
**Output (outperformed):**
```
If I traded everything in ETH:
Up +44%
  ($30.5K difference)
```

**Output (underperformed):**
```
If I traded everything in ETH:
Down -44%
  ($30.5K difference)
```

**Styling:**
- "Up" and percentage displayed in green
- "Down" and percentage displayed in red
- USD difference shown in dimmed/gray text as supplementary info

#### Success Conditions
- Has buy transactions with volume ≥$10
- Found ETH price data for transactions
- Successfully fetched current ETH price

#### Fallback Message
"No meaningful history yet for young wallets, CEX-only flows excluded"

#### Implementation File
`src/features/ethBenchmark.ts`

#### Notes
- Uses simplified model: `totalUsdSpent` as proxy for current portfolio value
- Sampling (top 50) provides ~98% coverage while maintaining performance
- Requires pre-generated `eth-prices.json` cache file (see `src/scripts/generateEthPrices.ts`)
- Multi-chain parallel fetching for performance

---

## Technical Architecture

### API Integration

#### Nansen API
- **Base URL:** Configured via environment variable
- **Authentication:** API key in `NANSEN_API_KEY` env var
- **Rate Limiting:** Minimal (no issues observed)
- **Service:** `src/services/nansen.service.ts`

#### CoinGecko API
- **Tier:** Free tier
- **Rate Limits:** ~10-30 calls/minute
- **Impact:** May cause 429 errors in batch operations
- **Service:** `src/services/coingecko.service.ts`

### Data Flow
```
User Input (Wallet Address)
    ↓
Validation & Normalization
    ↓
Parallel API Calls (5 fun facts)
    ↓
Data Processing & Calculation
    ↓
Display Formatting (new copywriting style)
    ↓
CLI Output
```

### Error Handling
- All features wrapped in try-catch blocks
- Graceful degradation with fallback messages
- Individual feature failures don't affect others
- Parallel execution with Promise.all + catch

### Performance Optimizations
1. **Parallel API Calls:** All 5 fun facts execute simultaneously
2. **Sampling:** ETH Benchmark uses top 50 transactions
3. **Pagination:** Limited records (top 20-100) for holdings
4. **Price Caching:** Historical ETH prices pre-loaded
5. **Multi-Chain Parallel:** Rugged Projects and ETH Benchmark fetch chains in parallel

---

## Configuration

### Environment Variables
```bash
NANSEN_API_KEY=<your_nansen_api_key>
```

### Constants & Thresholds

#### P&L
- `years`: 1 (configurable in function call)
- Minimum activity: $1 USD or 0.01%

#### Win Rate
- `years`: 1 (configurable in function call)
- Minimum trades: 1

#### Rugged Projects
- `MIN_INVESTMENT`: $100
- `LOSS_THRESHOLD`: -90%
- `MIN_AGE_DAYS`: 30
- `DEAD_PRICE_THRESHOLD`: $0.00001
- `HOLD_PERCENTAGE`: 80%
- `SUPPORTED_CHAINS`: ['ethereum', 'arbitrum', 'polygon', 'base', 'optimism']

#### ETH Benchmark
- `MONTHS_LOOKBACK`: 12
- `MIN_VOLUME_USD`: $10
- `TOP_TRANSACTIONS`: 50
- `SUPPORTED_CHAINS`: ['ethereum', 'arbitrum', 'polygon', 'base', 'optimism']

#### Portfolio at ATH
- `ATH_LOOKBACK_DAYS`: 365
- `TOP_HOLDINGS_COUNT`: 20
- `MIN_VALUE_USD`: $50

---

## Display Style Guide

### Copywriting Principles
1. **First-person narrative:** "My wallet", "I have"
2. **Casual tone:** "battle scars", hypothetical phrasing
3. **Simplified metrics:** Focus on key numbers, remove clutter
4. **Percentage-first:** Guide with %, show USD as supplementary
5. **Color coding:** Green for positive, red for negative, yellow for neutral

### Output Format Pattern
```
[Context/Setup Line]:
[Primary Metric] (colored)
  ([Supplementary Detail]) (dimmed)
```

### Color Scheme
- **Green:** Gains, positive performance, success
- **Red:** Losses, negative performance, warnings
- **Yellow:** Neutral/moderate values
- **Dim/Gray:** Supplementary information, notes

---

## Testing & Validation

### Test Wallets Used
- `0x22F7406101f90771d5bb3E930195cCc6700cC583`
- `0x5648B4f63359dd5C901d0CB801a3CB2F030C0625`
- `0x952b65Cb452fd82225c9E92DFf353e975aE398B4`
- `0x435dd9d601482314226b14df84ec4050ba2aaeb7`
- `0xb967d330bd47a45b0746025ba3cf76b8a9988106`
- `0x586ca92c4AB530f9F9b686aD754e1274702C037f`

### Coverage Metrics
Based on 6-wallet test run:
- **P&L:** 100% success rate
- **Win Rate:** 83% success rate
- **Rugged Projects:** 100% success rate (including zero-rug cases)
- **ETH Benchmark:** 67% success rate (limited by CoinGecko rate limits)
- **Portfolio ATH:** 50% success rate (limited by CoinGecko rate limits)

### Build & Deploy
```bash
# Build
npm run build

# Run CLI
node dist/index.js

# Run multi-wallet test
node dist/test-multiple-wallets.js
```

---

## Future Enhancements

### Potential Improvements
1. **CoinGecko Rate Limiting:** Upgrade to paid tier or implement request queuing
2. **Price Cache Expansion:** Cache more historical prices beyond ETH
3. **Chain Coverage:** Expand Rugged Projects and ETH Benchmark to all chains
4. **Detailed Mode:** Optional toggle for detailed breakdowns vs. simplified copywriting
5. **Export Formats:** JSON, CSV, or image card generation

### Disabled Features (Can Be Re-enabled)
- Fun Fact #2: Labels (Wallet reputation)
- Fun Fact #3: Smart Money Traders
- Fun Fact #8: Biggest Bag
- Fun Fact #9: Token Diversity
- Fun Fact #10: Multi-Chain Explorer

All disabled features are commented in code and can be re-enabled by uncommenting.

---

## Maintenance

### Dependencies
- `date-fns`: Date manipulation
- `inquirer`: CLI prompts
- `ora`: Loading spinners
- `chalk`: Terminal styling
- `axios`: HTTP requests
- TypeScript, Node.js

### File Structure
```
src/
├── features/           # Fun fact implementations
│   ├── pnl.ts
│   ├── winRate.ts
│   ├── ruggedProjects.ts
│   ├── ethBenchmark.ts
│   └── portfolioATH.ts
├── services/          # API service layers
│   ├── nansen.service.ts
│   ├── coingecko.service.ts
│   └── priceCache.service.ts
├── types/             # TypeScript type definitions
├── utils/             # Formatting & validation utilities
├── data/              # Cached data (eth-prices.json)
└── index.ts          # Main application entry point
```

---

**Document Version:** 1.0  
**Last Review:** November 17, 2025  
**Maintained By:** Development Team

