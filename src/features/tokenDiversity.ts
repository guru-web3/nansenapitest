import { nansenService } from '../services/nansen.service';
import { TokenDiversityFunFact } from '../types';

const MIN_VALUE_USD = 10; // Minimum $10 to consider

/**
 * Analyzes wallet's token portfolio diversity
 * @param address - Wallet address to analyze
 * @returns Token Diversity Fun Fact
 */
export async function analyzeTokenDiversity(address: string): Promise<TokenDiversityFunFact> {
  try {
    // Fetch all holdings
    const balanceResponse = await nansenService.getAllCurrentBalances({
      address,
      chain: 'all',
      hide_spam_token: true,
      pagination: {
        page: 1,
        per_page: 100,
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
        type: 'token_diversity',
        success: false,
        fallback: 'No significant holdings found',
      };
    }

    const holdings = balanceResponse.data;
    const uniqueTokens = holdings.length;

    // Calculate total portfolio value
    const totalValueUsd = holdings.reduce((sum, holding) => sum + holding.value_usd, 0);

    if (totalValueUsd < MIN_VALUE_USD) {
      return {
        type: 'token_diversity',
        success: false,
        fallback: 'No significant holdings found',
      };
    }

    // Calculate top 3 concentration
    const top3Value = holdings
      .slice(0, 3)
      .reduce((sum, holding) => sum + holding.value_usd, 0);
    const top3Concentration = (top3Value / totalValueUsd) * 100;

    // Determine diversity score based on concentration and unique tokens
    let diversityScore: 'HIGH' | 'MEDIUM' | 'LOW';
    
    if (uniqueTokens >= 15 && top3Concentration < 50) {
      diversityScore = 'HIGH'; // Well diversified
    } else if (uniqueTokens >= 5 && top3Concentration < 75) {
      diversityScore = 'MEDIUM'; // Moderately diversified
    } else {
      diversityScore = 'LOW'; // Concentrated portfolio
    }

    return {
      type: 'token_diversity',
      success: true,
      data: {
        uniqueTokens,
        totalValueUsd,
        top3Concentration,
        diversityScore,
      },
    };
  } catch (error) {
    console.error('Error analyzing token diversity:', error);
    return {
      type: 'token_diversity',
      success: false,
      fallback: 'No significant holdings found',
    };
  }
}



