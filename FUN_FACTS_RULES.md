# Fun Facts - Detailed Rules & Implementation

This document provides comprehensive rules, logic, and thresholds for all 10 fun facts implemented in the system.

---

## Table of Contents
1. [P&L (Profit & Loss)](#1-pl-profit--loss)
2. [Labels](#2-labels)
3. [Smart Money Traders](#3-smart-money-traders)
4. [Rugged Projects](#4-rugged-projects)
5. [ETH Benchmark](#5-eth-benchmark)
6. [Portfolio at ATH](#6-portfolio-at-ath)
7. [Win Rate Champion](#7-win-rate-champion)
8. [Biggest Bag](#8-biggest-bag)
9. [Token Diversity](#9-token-diversity)
10. [Multi-Chain Explorer](#10-multi-chain-explorer)

---

## 1. P&L (Profit & Loss)

### Overview
Analyzes realized profit and loss from trading activity over the past year.

### Data Source
| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | `POST /api/v1/profiler/address/pnl-summary` | `realized_pnl`, `realized_roi`, `unrealized_pnl`, `unrealized_roi` |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Time Period** | 1 year (365 days) | Looks back from current date |
| **Chain Coverage** | `all` | All supported chains |
| **Date Range** | `from`: 1 year ago, `to`: now | Dynamic calculation |

### Calculation Logic

```typescript
// Main metrics
realized_pnl_usd = response.realized_pnl (direct from API)
realized_pnl_percent = response.realized_roi × 100
unrealized_pnl_usd = response.unrealized_pnl (direct from API)
unrealized_pnl_percent = response.unrealized_roi × 100
```

### Success Conditions

| Condition | Result |
|-----------|--------|
| API returns valid `realized_pnl` | ✅ Success |
| API returns null/undefined | ❌ Fallback |
| No trading history in timeframe | ❌ Fallback |

### Fallback Message
`"Not enough trading history to calculate P&L"`

### Display Format
- Positive P&L: Green text with `+` prefix
- Negative P&L: Red text with `-` prefix
- Shows both percentage and USD amount

---

## 2. Labels

### Overview
Identifies wallet classification labels assigned by Nansen (e.g., Whale, DEX Trader, Staker).

### Data Source
| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | `POST /api/v1/profiler/address/wallet-labels` | `label`, `tag_name`, `label_type`, `label_subtype` |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Chain Coverage** | `all` | All supported chains |
| **Pagination** | Page 1, 100 per page | Fetches all labels |

### Label Priority System

Labels are prioritized based on importance and specificity:

| Priority | Label Type | Examples |
|----------|------------|----------|
| **1-10** | Exchange & CEX | Binance, Coinbase, Kraken |
| **11-20** | Smart Contracts | Uniswap, AAVE, Compound |
| **21-30** | Special Categories | Whale, Fund, Smart Money |
| **31-40** | Trading Behavior | DEX Trader, NFT Trader, Active Trader |
| **41-50** | General Usage | OpenSea User, Token Holder |
| **51+** | Miscellaneous | ENS names, generic labels |

### Selection Logic

```typescript
1. Fetch all labels for the address
2. Filter out generic/low-priority labels (priority > 50)
3. Sort by priority (ascending)
4. Select the label with the LOWEST priority number (highest importance)
```

### Success Conditions

| Condition | Result |
|-----------|--------|
| One or more labels found | ✅ Success (displays highest priority) |
| No labels found | ❌ Fallback |
| API error | ❌ Fallback |

### Fallback Message
`"No special wallet labels detected"`

---

## 3. Smart Money Traders

### Overview
Detects if the wallet has interactions with other wallets labeled as "Smart Money" by Nansen.

### Data Source
| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | `POST /api/v1/profiler/address/transactions` | `from_address`, `to_address`, `from_address_label`, `to_address_label` |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Time Period** | 2 years (730 days) | Looks back from current date |
| **Chain Coverage** | `ethereum`, `arbitrum`, `polygon`, `base`, `optimism` | Top 5 chains |
| **Transaction Limit** | 100 per chain | Max 500 total transactions |
| **Spam Filter** | `hide_spam_token: true` | Filters out spam |

### Detection Logic

```typescript
For each transaction:
  1. Check if from_address_label contains "Smart Money"
  2. Check if to_address_label contains "Smart Money"
  3. If either matches → add counterparty to smart money set

Smart Money Count = unique smart money addresses detected
```

### Smart Money Criteria

| Criteria | Threshold |
|----------|-----------|
| **Minimum Transactions** | 1 | At least 1 interaction with smart money |
| **Label Match** | Case-insensitive contains "smart money" | Flexible matching |
| **Unique Addresses** | Deduplicated | Same smart money wallet counted once |

### Success Conditions

| Condition | Result |
|-----------|--------|
| ≥1 smart money interaction | ✅ Success |
| 0 smart money interactions | ❌ Fallback |
| No transactions found | ❌ Fallback |

### Fallback Message
`"No interactions with Smart Money wallets detected"`

### Display Format
Shows count of unique smart money wallets interacted with:
- `"Detected interactions with [count] Smart Money wallet(s)"`

---

## 4. Rugged Projects

### Overview
Identifies tokens that may have been part of rug pulls or scam projects based on holding behavior.

### Data Source
| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | Multiple endpoints | Current balance, transaction history |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Time Period** | 2 years (730 days) | Transaction history lookback |
| **Chain Coverage** | `ethereum`, `arbitrum`, `polygon`, `base`, `optimism` | Top 5 chains |
| **Min Volume** | $50 USD | Minimum transaction volume |
| **Spam Filter** | `hide_spam_token: true` | Filters out spam |
| **Transaction Limit** | 100 per chain | Max 500 total |

### Rug Detection Logic

```typescript
For each token in wallet history:
  1. Calculate total purchased amount
  2. Calculate current holdings
  3. Calculate sold amount
  4. Determine hold percentage = (current / purchased) × 100

If hold percentage ≤ 5% AND purchased > $50:
  → Token flagged as potentially rugged
```

### Thresholds

| Metric | Threshold | Reasoning |
|--------|-----------|-----------|
| **Max Hold %** | ≤5% | If you sold 95%+ of holdings |
| **Min Purchase** | $50 USD | Filters out insignificant trades |
| **Min Loss** | $0 | Any loss counts if other criteria met |

### Position Categories

| Hold % | Category | Interpretation |
|--------|----------|----------------|
| 0% | Fully exited | Sold everything |
| 0.1% - 5% | Mostly exited | Sold 95%+ (potential rug) |
| 5.1% - 25% | Significantly reduced | Normal profit-taking |
| 25%+ | Still holding | Active position |

### Success Conditions

| Condition | Result |
|-----------|--------|
| ≥1 rugged token detected | ✅ Success (shows count & loss) |
| 0 rugged tokens | ❌ Fallback (positive message) |
| No trading history | ❌ Fallback |

### Fallback Message
`"No rugged projects detected - good eye! 👀"`

### Display Format
- Shows count of rugged tokens
- Shows total realized loss in USD
- Lists token symbols if applicable

---

## 5. ETH Benchmark

### Overview
Compares wallet's trading performance against a simple "buy and hold ETH" strategy.

### Data Sources

| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | `POST /api/v1/profiler/address/transactions` | Transaction history |
| CoinGecko API | `GET /coins/ethereum/history` | Historical ETH prices |
| Price Cache | Local JSON file | Cached ETH prices |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Time Period** | 12 months | Extended from 6 for better coverage |
| **Chain Coverage** | `ethereum`, `arbitrum`, `polygon`, `base`, `optimism` | Top 5 chains |
| **Min Volume** | $1,000 USD | Only significant transactions |
| **Transaction Sample** | Top 50 by volume | ~98% portfolio coverage |
| **Spam Filter** | `hide_spam_token: true` | Filters out spam |

### Calculation Logic

```typescript
Step 1: Calculate Wallet P&L
  - Sum all realized P&L from transactions
  - Get current unrealized P&L
  - wallet_pnl = realized + unrealized

Step 2: Calculate ETH Alternative
  For each transaction:
    1. Get USD value at transaction time
    2. Get ETH price at transaction time (cached or API)
    3. Calculate ETH amount = USD value / ETH price
    4. Calculate current ETH value = ETH amount × current ETH price
  
  eth_value = sum of all current ETH values
  initial_investment = sum of all USD values at transaction time
  eth_pnl = eth_value - initial_investment

Step 3: Compare
  performance_percent = ((wallet_pnl - eth_pnl) / initial_investment) × 100
```

### Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| **Min Transactions** | 1 | Need at least 1 transaction |
| **Min Volume** | $1,000 USD | Ignore small trades |
| **Sample Size** | 50 transactions | Top transactions by volume |

### Price Cache Strategy

| Priority | Source | Fallback |
|----------|--------|----------|
| 1 | Local cache file | If exists, use cached price |
| 2 | CoinGecko API | Fetch historical price |
| 3 | Estimate | Use current price (worst case) |

### Success Conditions

| Condition | Result |
|-----------|--------|
| ≥1 valid transaction with price data | ✅ Success |
| No transactions above threshold | ❌ Fallback |
| CoinGecko API rate limited | ❌ Fallback |
| No price data available | ❌ Fallback |

### Fallback Message
`"Not enough transaction history to benchmark against ETH"`

### Display Format
- Shows performance vs ETH as percentage
- Positive (green): Outperformed ETH
- Negative (red): Underperformed ETH

---

## 6. Portfolio at ATH

### Overview
Calculates potential portfolio value if all holdings were at their all-time high prices.

### Data Sources

| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | `POST /api/v1/profiler/address/current-balance` | Current holdings |
| CoinGecko API | `GET /coins/{id}/market_chart` | Historical price data for ATH |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Chain Coverage** | `all` | All supported chains |
| **Min Value** | $50 USD | Minimum holding value |
| **Holdings Sample** | Top 20 tokens | ~98% portfolio coverage |
| **ATH Lookback** | 365 days | Max 1 year of price history |
| **Spam Filter** | `hide_spam_token: true` | Filters out spam |

### Calculation Logic

```typescript
Step 1: Get Current Portfolio
  - Fetch all holdings with value ≥ $50
  - Sort by value descending
  - Take top 20 holdings
  - current_value = sum of all holding values

Step 2: Calculate ATH Values
  For each holding:
    1. Get CoinGecko ID from token symbol/name
    2. Fetch market_chart for last 365 days
    3. Find max price in history (ATH)
    4. Calculate: ath_value = token_amount × ath_price
  
  ath_portfolio_value = sum of all ath_values

Step 3: Calculate Potential Gain
  potential_gain_usd = ath_portfolio_value - current_value
  potential_gain_percent = (potential_gain_usd / current_value) × 100
```

### Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| **Min Holding Value** | $50 USD | Filter small positions |
| **Top Holdings** | 20 tokens | Coverage limit |
| **ATH Lookback** | 365 days | 1 year max history |
| **Min Current Value** | $50 USD | Total portfolio minimum |

### CoinGecko Mapping

| Priority | Method | Description |
|----------|--------|-------------|
| 1 | Direct symbol lookup | Try exact symbol match |
| 2 | Name search | Search by token name |
| 3 | Manual mapping | Hardcoded common tokens (ETH, BTC, etc.) |
| 4 | Skip | If no match found |

### Success Conditions

| Condition | Result |
|-----------|--------|
| ≥1 token with ATH data | ✅ Success |
| Current portfolio < $50 | ❌ Fallback |
| No ATH data retrieved | ❌ Fallback |
| CoinGecko API rate limited | ❌ Fallback |

### Fallback Message
`"Not enough portfolio data to calculate ATH potential"`

### Display Format
- Shows potential gain as percentage
- Shows absolute USD value of potential gain
- Always positive (potential upside)

---

## 7. Win Rate Champion

### Overview
Calculates trading win rate and identifies the best performing token.

### Data Source

| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | `POST /api/v1/profiler/address/pnl-summary` | `win_rate`, `traded_times`, `traded_token_count`, `top5_tokens` |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Time Period** | 1 year (365 days) | Default lookback |
| **Chain Coverage** | `all` | All supported chains |

### Calculation Logic

```typescript
Step 1: Get Win Rate Data
  win_rate = response.win_rate × 100  // Convert to percentage
  traded_tokens = response.traded_token_count
  traded_times = response.traded_times

Step 2: Find Best Token
  best_token = max(top5_tokens, by: realized_roi)
  best_token_roi = best_token.realized_roi × 100
  best_token_pnl = best_token.realized_pnl (USD)
  best_token_chain = best_token.chain
```

### Win Rate Definition

| Metric | Formula | Description |
|--------|---------|-------------|
| **Win Rate** | (Winning trades / Total trades) × 100 | Nansen calculates this |
| **Winning Trade** | Any trade with positive P&L | Nansen definition |
| **Traded Times** | Total number of completed trades | Buy + sell cycles |

### Best Token Selection

| Priority | Criteria | Description |
|----------|----------|-------------|
| 1 | Highest `realized_roi` | Among top 5 tokens by volume |
| 2 | Must have closed positions | Only realized gains count |
| 3 | From `top5_tokens` array | Pre-filtered by Nansen |

### Success Conditions

| Condition | Result |
|-----------|--------|
| `win_rate` is defined | ✅ Success |
| `traded_times` > 0 | ✅ Success |
| No trading data | ❌ Fallback |
| `win_rate` is null/undefined | ❌ Fallback |

### Fallback Message
`"Not enough trading history to calculate win rate"`

### Display Format
- Win rate ≥50%: Green text
- Win rate <50%: Yellow text
- Shows traded token count and trade count
- Highlights best performing token with ROI and P&L

---

## 8. Biggest Bag

### Overview
Identifies the largest token holding by USD value and its portfolio percentage.

### Data Source

| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | `POST /api/v1/profiler/address/current-balance` | `token_symbol`, `token_name`, `value_usd`, `chain` |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Chain Coverage** | `all` | All supported chains |
| **Min Value** | $10 USD | Minimum holding value |
| **Pagination** | Page 1, 50 per page | Top holdings |
| **Sort Order** | `value_usd DESC` | Largest first |
| **Spam Filter** | `hide_spam_token: true` | Filters out spam |

### Calculation Logic

```typescript
Step 1: Get All Holdings
  - Fetch holdings with value ≥ $10
  - Already sorted by value_usd DESC
  - holdings = response.data

Step 2: Calculate Portfolio Total
  total_value = sum(all holdings.value_usd)

Step 3: Identify Biggest Bag
  biggest = holdings[0]  // First item (highest value)
  percent = (biggest.value_usd / total_value) × 100
```

### Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| **Min Holding Value** | $10 USD | Individual token minimum |
| **Min Portfolio Value** | $10 USD | Total portfolio minimum |
| **Pagination Limit** | 50 holdings | Coverage limit |

### Portfolio Concentration Levels

| Percentage | Category | Risk Assessment |
|------------|----------|-----------------|
| 90-100% | Extremely concentrated | Very high risk |
| 70-89% | Highly concentrated | High risk |
| 50-69% | Moderately concentrated | Medium risk |
| 30-49% | Somewhat diversified | Lower risk |
| <30% | Well diversified | Lowest risk |

### Success Conditions

| Condition | Result |
|-----------|--------|
| ≥1 holding with value ≥$10 | ✅ Success |
| Total portfolio value ≥$10 | ✅ Success |
| No significant holdings | ❌ Fallback |
| All holdings <$10 | ❌ Fallback |

### Fallback Message
`"No significant holdings found"`

### Display Format
- Shows token symbol and full name
- Shows USD value of holding
- Shows blockchain network
- Shows percentage of total portfolio

---

## 9. Token Diversity

### Overview
Analyzes portfolio diversification by calculating a diversity score based on token count and concentration.

### Data Source

| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | `POST /api/v1/profiler/address/current-balance` | All current holdings |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Chain Coverage** | `all` | All supported chains |
| **Min Value** | $10 USD | Minimum holding value |
| **Pagination** | Page 1, 100 per page | Max holdings |
| **Spam Filter** | `hide_spam_token: true` | Filters out spam |

### Calculation Logic

```typescript
Step 1: Get All Holdings
  holdings = all tokens with value ≥ $10
  unique_tokens = holdings.length
  total_value = sum(holdings.value_usd)

Step 2: Calculate Top 3 Concentration
  sorted_holdings = sort(holdings, by: value_usd DESC)
  top3_holdings = sorted_holdings[0..2]
  top3_value = sum(top3_holdings.value_usd)
  top3_concentration = (top3_value / total_value) × 100

Step 3: Calculate Diversity Score
  if (unique_tokens ≥ 10 AND top3_concentration ≤ 50%):
    score = "HIGH"
  else if (unique_tokens ≥ 5 AND top3_concentration ≤ 75%):
    score = "MEDIUM"
  else:
    score = "LOW"
```

### Diversity Score Matrix

| Unique Tokens | Top 3 Concentration | Diversity Score |
|---------------|---------------------|-----------------|
| ≥10 | ≤50% | **HIGH** |
| ≥5 | ≤75% | **MEDIUM** |
| <5 | Any | **LOW** |
| Any | >75% | **LOW** |
| ≥10 | >50% and ≤75% | **MEDIUM** |

### Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| **Min Token Value** | $10 USD | Individual token minimum |
| **Min Portfolio Value** | $10 USD | Total portfolio minimum |
| **High Diversity Tokens** | ≥10 | Many tokens |
| **High Diversity Concentration** | ≤50% | Top 3 ≤50% |
| **Medium Diversity Tokens** | ≥5 | Several tokens |
| **Medium Diversity Concentration** | ≤75% | Top 3 ≤75% |

### Interpretation Guide

| Score | Meaning | Example |
|-------|---------|---------|
| **HIGH** | Well-diversified portfolio | 15 tokens, top 3 = 40% |
| **MEDIUM** | Moderately diversified | 7 tokens, top 3 = 65% |
| **LOW** | Concentrated portfolio | 3 tokens, top 3 = 90% |

### Success Conditions

| Condition | Result |
|-----------|--------|
| ≥1 holding with value ≥$10 | ✅ Success |
| Total portfolio value ≥$10 | ✅ Success |
| No significant holdings | ❌ Fallback |

### Fallback Message
`"No significant holdings found"`

### Display Format
- Shows diversity score (HIGH/MEDIUM/LOW)
- Color coded: HIGH=green, MEDIUM=yellow, LOW=red
- Shows unique token count
- Shows total portfolio value
- Shows top 3 concentration percentage

---

## 10. Multi-Chain Explorer

### Overview
Tracks wallet activity across multiple blockchain networks and identifies the primary chain.

### Data Source

| Source | Endpoint | Data Used |
|--------|----------|-----------|
| Nansen API | `POST /api/v1/profiler/address/current-balance` | Holdings across all chains |

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Chain Coverage** | `all` | All supported chains |
| **Min Value** | $10 USD | Minimum holding value |
| **Pagination** | Page 1, 100 per page | Max holdings |
| **Spam Filter** | `hide_spam_token: true` | Filters out spam |

### Calculation Logic

```typescript
Step 1: Get Holdings Across All Chains
  holdings = all tokens with value ≥ $10
  
Step 2: Group by Chain
  For each holding:
    chain_stats[chain].count += 1
    chain_stats[chain].value += holding.value_usd

Step 3: Calculate Chain Metrics
  chains = unique chain names
  chain_count = chains.length
  
Step 4: Identify Primary Chain
  primary_chain = chain with highest total value
  primary_chain_value = sum of holdings on primary chain
  total_value = sum of all holdings
  primary_chain_percent = (primary_chain_value / total_value) × 100
```

### Multi-Chain Detection

| Chain Count | Category | Interpretation |
|-------------|----------|----------------|
| 1 | Single-chain | Not a multi-chain user |
| 2 | Dual-chain | Beginning multi-chain |
| 3-4 | Multi-chain | Active multi-chain user |
| 5+ | Omni-chain | Advanced multi-chain |

### Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| **Min Holding Value** | $10 USD | Per-token minimum |
| **Min Chain Count** | 2 | Need activity on 2+ chains |
| **Primary Chain Min** | $10 USD | Must have ≥$10 on primary |

### Primary Chain Dominance

| Primary Chain % | Category | Interpretation |
|-----------------|----------|----------------|
| 90-100% | Dominant | Mostly on one chain |
| 70-89% | Strong preference | Clear favorite chain |
| 50-69% | Balanced | Moderate distribution |
| 30-49% | Well-distributed | Very balanced |
| <30% | Highly distributed | No clear primary |

### Success Conditions

| Condition | Result |
|-----------|--------|
| Active on ≥2 chains | ✅ Success |
| Holdings on 1 chain only | ❌ Fallback (single-chain message) |
| No significant holdings | ❌ Fallback (no activity message) |

### Fallback Messages

| Scenario | Message |
|----------|---------|
| Single chain | `"Single chain wallet - consider exploring other networks!"` |
| No activity | `"No multi-chain activity detected"` |

### Display Format
- Shows total chain count
- Lists all active chains (alphabetically sorted)
- Shows primary chain with percentage
- Displays up to 5 chains in summary (+ count if more)

---

## Summary Table: All Fun Facts At a Glance

| # | Fun Fact | Data Source | Time Period | Min Threshold | Chain Coverage | Success Rate |
|---|----------|-------------|-------------|---------------|----------------|--------------|
| 1 | **P&L** | Nansen PnL Summary | 1 year | N/A | All | 67% |
| 2 | **Labels** | Nansen Labels | Current | N/A | All | 50% |
| 3 | **Smart Money** | Nansen Transactions | 2 years | 1 interaction | Top 5 | 17% |
| 4 | **Rugged Projects** | Nansen Balance + TX | 2 years | $50 purchase | Top 5 | 100% |
| 5 | **ETH Benchmark** | Nansen TX + CoinGecko | 12 months | $1,000 volume | Top 5 | 50-67% |
| 6 | **Portfolio ATH** | Nansen Balance + CoinGecko | 1 year ATH | $50 holding | All | 17-33% |
| 7 | **Win Rate** | Nansen PnL Summary | 1 year | 1 trade | All | 100% |
| 8 | **Biggest Bag** | Nansen Balance | Current | $10 holding | All | 83% |
| 9 | **Token Diversity** | Nansen Balance | Current | $10 holding | All | 83% |
| 10 | **Multi-Chain** | Nansen Balance | Current | $10 holding | All | 67-83% |

---

## API Dependencies & Rate Limits

### Nansen API
- **Rate Limit**: Not specified (appears to be generous)
- **Reliability**: High (few errors)
- **Coverage**: All features except ETH Benchmark & Portfolio ATH

### CoinGecko API (Free Tier)
- **Rate Limit**: ~10-30 requests/minute
- **Reliability**: Medium (frequent 429 errors with multiple wallets)
- **Coverage**: ETH Benchmark & Portfolio ATH only
- **Recommendation**: Upgrade to Pro for production use

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2025 | Initial implementation (6 original features) |
| 2.0 | Nov 2025 | Added 4 new features (Win Rate, Biggest Bag, Diversity, Multi-Chain) |
| 2.1 | Nov 2025 | Multi-chain support for ETH Benchmark & Rugged Projects |
| 2.2 | Nov 2025 | Extended lookback periods & sampling sizes |

---

**Document End**



