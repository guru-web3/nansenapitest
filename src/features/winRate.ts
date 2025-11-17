import { subYears } from 'date-fns';
import { nansenService } from '../services/nansen.service';
import { WinRateFunFact } from '../types';

/**
 * Analyzes wallet's trading win rate and best performing token
 * @param address - Wallet address to analyze
 * @param years - Number of years to look back (default: 1)
 * @returns Win Rate Fun Fact
 */
export async function analyzeWinRate(address: string, years: number = 1): Promise<WinRateFunFact> {
  try {
    const now = new Date();
    const fromDate = subYears(now, years);

    const response = await nansenService.getPnlSummary({
      address,
      chain: 'all',
      date: {
        from: fromDate.toISOString(),
        to: now.toISOString(),
      },
    });

    // Check if we have valid data
    if (!response || response.win_rate === undefined) {
      return {
        type: 'win_rate',
        success: false,
        fallback: 'Not enough trading history to calculate win rate',
      };
    }

    // Check if there's meaningful trading activity
    const tradedTokens = response.traded_token_count || 0;
    const tradedTimes = response.traded_times || 0;

    if (tradedTokens === 0 || tradedTimes === 0) {
      return {
        type: 'win_rate',
        success: false,
        fallback: 'Not enough trading history to calculate win rate',
      };
    }

    // Convert win rate from decimal to percentage
    const winRatePercent = response.win_rate * 100;

    // Find best performing token from top5_tokens
    let bestToken;
    if (response.top5_tokens && response.top5_tokens.length > 0) {
      // Find token with highest ROI
      const topToken = response.top5_tokens.reduce((best, current) => 
        current.realized_roi > best.realized_roi ? current : best
      );

      bestToken = {
        symbol: topToken.token_symbol,
        roi: topToken.realized_roi * 100, // Convert to percentage
        pnl: topToken.realized_pnl,
        chain: topToken.chain,
      };
    }

    return {
      type: 'win_rate',
      success: true,
      data: {
        winRate: winRatePercent,
        tradedTokens,
        tradedTimes,
        bestToken,
      },
    };
  } catch (error) {
    console.error('Error analyzing win rate:', error);
    return {
      type: 'win_rate',
      success: false,
      fallback: 'Not enough trading history to calculate win rate',
    };
  }
}



