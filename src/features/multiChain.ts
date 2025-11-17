import { subYears } from 'date-fns';
import { nansenService } from '../services/nansen.service';
import { MultiChainFunFact } from '../types';

const MIN_VALUE_USD = 10; // Minimum $10 USD to consider

/**
 * Analyzes wallet's multi-chain activity
 * @param address - Wallet address to analyze
 * @returns Multi-Chain Fun Fact
 */
export async function analyzeMultiChain(address: string): Promise<MultiChainFunFact> {
  try {
    // Fetch current holdings across all chains
    const balanceResponse = await nansenService.getAllCurrentBalances({
      address,
      chain: 'all',
      hide_spam_token: true,
      pagination: {
        page: 1,
        per_page: 100,
      },
      filters: {
        value_usd: {
          min: MIN_VALUE_USD,
        },
      },
    });

    // Check if wallet has any holdings
    if (!balanceResponse.data || balanceResponse.data.length === 0) {
      return {
        type: 'multi_chain',
        success: false,
        fallback: 'No multi-chain activity detected',
      };
    }

    const holdings = balanceResponse.data;

    // Count holdings and value per chain
    const chainStats = new Map<string, { count: number; value: number }>();

    for (const holding of holdings) {
      const chain = holding.chain;
      if (!chainStats.has(chain)) {
        chainStats.set(chain, { count: 0, value: 0 });
      }
      const stats = chainStats.get(chain)!;
      stats.count++;
      stats.value += holding.value_usd;
    }

    // Get unique chains
    const chains = Array.from(chainStats.keys());
    const chainCount = chains.length;

    // If only one chain, not multi-chain
    if (chainCount === 1) {
      return {
        type: 'multi_chain',
        success: false,
        fallback: 'Single chain wallet - consider exploring other networks!',
      };
    }

    // Find primary chain (by value)
    let primaryChain = chains[0];
    let primaryChainValue = chainStats.get(primaryChain)!.value;

    for (const chain of chains) {
      const value = chainStats.get(chain)!.value;
      if (value > primaryChainValue) {
        primaryChain = chain;
        primaryChainValue = value;
      }
    }

    // Calculate total value
    const totalValue = Array.from(chainStats.values()).reduce(
      (sum, stats) => sum + stats.value,
      0
    );

    // Calculate primary chain percentage
    const primaryChainPercent = (primaryChainValue / totalValue) * 100;

    // Sort chains by value for display
    const sortedChains = chains.sort((a, b) => {
      const aValue = chainStats.get(a)!.value;
      const bValue = chainStats.get(b)!.value;
      return bValue - aValue;
    });

    return {
      type: 'multi_chain',
      success: true,
      data: {
        chainCount,
        chains: sortedChains,
        primaryChain,
        primaryChainPercent,
      },
    };
  } catch (error) {
    console.error('Error analyzing multi-chain activity:', error);
    return {
      type: 'multi_chain',
      success: false,
      fallback: 'No multi-chain activity detected',
    };
  }
}



