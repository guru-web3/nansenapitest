import { nansenService } from '../services/nansen.service';
import { BiggestBagFunFact } from '../types';

const MIN_VALUE_USD = 10; // Minimum $10 to consider

/**
 * Identifies wallet's largest token holding
 * @param address - Wallet address to analyze
 * @returns Biggest Bag Fun Fact
 */
export async function analyzeBiggestBag(address: string): Promise<BiggestBagFunFact> {
  try {
    // Fetch top holdings
    const balanceResponse = await nansenService.getCurrentBalance({
      address,
      chain: 'all',
      hide_spam_token: true,
      pagination: {
        page: 1,
        per_page: 50,
      },
      order_by: [
        {
          field: 'value_usd',
          direction: 'DESC',
        },
      ],
      filters: {
        value_usd: {
          min: MIN_VALUE_USD,
        },
      },
    });

    // Check if wallet has any holdings
    if (!balanceResponse.data || balanceResponse.data.length === 0) {
      return {
        type: 'biggest_bag',
        success: false,
        fallback: 'No significant holdings found',
      };
    }

    const holdings = balanceResponse.data;

    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, holding) => sum + holding.value_usd, 0);

    if (totalValue < MIN_VALUE_USD) {
      return {
        type: 'biggest_bag',
        success: false,
        fallback: 'No significant holdings found',
      };
    }

    // First holding is the biggest (already sorted by value_usd DESC)
    const biggestHolding = holdings[0];

    // Calculate percentage of portfolio
    const percentOfPortfolio = (biggestHolding.value_usd / totalValue) * 100;

    return {
      type: 'biggest_bag',
      success: true,
      data: {
        tokenSymbol: biggestHolding.token_symbol,
        tokenName: biggestHolding.token_name,
        valueUsd: biggestHolding.value_usd,
        chain: biggestHolding.chain,
        percentOfPortfolio,
      },
    };
  } catch (error) {
    console.error('Error analyzing biggest bag:', error);
    return {
      type: 'biggest_bag',
      success: false,
      fallback: 'No significant holdings found',
    };
  }
}



