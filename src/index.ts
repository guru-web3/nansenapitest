#!/usr/bin/env node

import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { validateAndNormalizeAddress, truncateAddress } from './utils/validation';
import {
  displayFunFact,
  formatPercentColored,
  formatUSD,
  createSectionHeader,
  successMessage,
  errorMessage,
  warningMessage,
  infoMessage,
} from './utils/formatting';
import { analyzePnl } from './features/pnl';
// import { analyzeLabels } from './features/labels'; // DISABLED: Fun Fact #2
// import { analyzeSmartMoney } from './features/smartMoney'; // DISABLED: Fun Fact #3
import { analyzeRuggedProjects } from './features/ruggedProjects';
import { analyzeEthBenchmark } from './features/ethBenchmark';
import { analyzePortfolioATH } from './features/portfolioATH';
import { analyzeWinRate } from './features/winRate';
// import { analyzeBiggestBag } from './features/biggestBag'; // DISABLED: Fun Fact #8
// import { analyzeTokenDiversity } from './features/tokenDiversity'; // DISABLED: Fun Fact #9
// import { analyzeMultiChain } from './features/multiChain'; // DISABLED: Fun Fact #10
import { FunFact } from './types';

/**
 * Main application logic
 */
async function main() {
  // Display welcome banner
  console.clear();
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                                                   ║'));
  console.log(chalk.bold.cyan('║     🎲  Fun Facts - Wallet Analyzer  🎲          ║'));
  console.log(chalk.bold.cyan('║                                                   ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════╝\n'));

  let continueAnalyzing = true;

  while (continueAnalyzing) {
    try {
      // Prompt for wallet address
      const { address } = await inquirer.prompt([
        {
          type: 'input',
          name: 'address',
          message: 'Enter wallet address to analyze:',
          validate: (input: string) => {
            try {
              validateAndNormalizeAddress(input);
              return true;
            } catch (error) {
              return (error as Error).message;
            }
          },
        },
      ]);

      const normalizedAddress = validateAndNormalizeAddress(address);
      console.log(chalk.gray(`\nAnalyzing wallet: ${truncateAddress(normalizedAddress)}\n`));

      // Run all analyses in parallel
      const spinner = ora('Fetching wallet data...').start();

      const [
        pnlResult,
        // labelsResult, // DISABLED: Fun Fact #2
        // smartMoneyResult, // DISABLED: Fun Fact #3
        ruggedProjectsResult,
        ethBenchmarkResult,
        portfolioATHResult,
        winRateResult,
        // biggestBagResult, // DISABLED: Fun Fact #8
        // tokenDiversityResult, // DISABLED: Fun Fact #9
        // multiChainResult, // DISABLED: Fun Fact #10
      ] = await Promise.all([
        analyzePnl(normalizedAddress).catch((err) => {
          console.error('P&L analysis error:', err);
          return {
            type: 'pnl' as const,
            success: false,
            fallback: 'Only mist—too little history to read.',
          };
        }),
        // DISABLED: Fun Fact #2 - Labels
        // analyzeLabels(normalizedAddress).catch((err) => {
        //   console.error('Labels analysis error:', err);
        //   return { type: 'labels' as const, success: false, fallback: null };
        // }),
        // DISABLED: Fun Fact #3 - Smart Money
        // analyzeSmartMoney(normalizedAddress).catch((err) => {
        //   console.error('Smart money analysis error:', err);
        //   return { type: 'smart_money' as const, success: false, fallback: null };
        // }),
        analyzeRuggedProjects(normalizedAddress).catch((err) => {
          console.error('Rugged projects analysis error:', err);
          return {
            type: 'rugged_projects' as const,
            success: true,
            data: { ruggedCount: 0, ruggedTokens: [] },
            fallback: 'No rugged projects detected—clear skies ahead',
          };
        }),
        analyzeEthBenchmark(normalizedAddress).catch((err) => {
          console.error('ETH benchmark analysis error:', err);
          return {
            type: 'eth_benchmark' as const,
            success: false,
            fallback: 'No meaningful history yet for young wallets, CEX-only flows excluded',
          };
        }),
        analyzePortfolioATH(normalizedAddress).catch((err) => {
          console.error('Portfolio ATH analysis error:', err);
          return {
            type: 'portfolio_ath' as const,
            success: false,
            fallback: 'No meaningful history yet for young/empty wallets',
          };
        }),
        analyzeWinRate(normalizedAddress).catch((err) => {
          console.error('Win rate analysis error:', err);
          return {
            type: 'win_rate' as const,
            success: false,
            fallback: 'Not enough trading history to calculate win rate',
          };
        }),
        // DISABLED: Fun Fact #8 - Biggest Bag
        // analyzeBiggestBag(normalizedAddress).catch((err) => {
        //   console.error('Biggest bag analysis error:', err);
        //   return {
        //     type: 'biggest_bag' as const,
        //     success: false,
        //     fallback: 'No significant holdings found',
        //   };
        // }),
        // DISABLED: Fun Fact #9 - Token Diversity
        // analyzeTokenDiversity(normalizedAddress).catch((err) => {
        //   console.error('Token diversity analysis error:', err);
        //   return {
        //     type: 'token_diversity' as const,
        //     success: false,
        //     fallback: 'No significant holdings found',
        //   };
        // }),
        // DISABLED: Fun Fact #10 - Multi-Chain Explorer
        // analyzeMultiChain(normalizedAddress).catch((err) => {
        //   console.error('Multi-chain analysis error:', err);
        //   return {
        //     type: 'multi_chain' as const,
        //     success: false,
        //     fallback: 'No multi-chain activity detected',
        //   };
        // }),
      ]);

      spinner.succeed('Analysis complete!\n');

      // Display results
      console.log(createSectionHeader('🎲 Fun Facts Results'));

      displayResult(1, 'P&L (Profit & Loss)', pnlResult);
      // displayResult(2, 'Wallet Labels', labelsResult); // DISABLED: Fun Fact #2
      // displayResult(3, 'Smart Money Trader', smartMoneyResult); // DISABLED: Fun Fact #3
      displayResult(4, 'Rugged Projects', ruggedProjectsResult);
      displayResult(5, 'ETH Benchmark', ethBenchmarkResult);
      displayResult(6, 'Portfolio at ATH', portfolioATHResult);
      displayResult(7, 'Win Rate Champion', winRateResult);
      // displayResult(8, 'Biggest Bag', biggestBagResult); // DISABLED: Fun Fact #8
      // displayResult(9, 'Token Diversity', tokenDiversityResult); // DISABLED: Fun Fact #9
      // displayResult(10, 'Multi-Chain Explorer', multiChainResult); // DISABLED: Fun Fact #10

      // Ask if user wants to analyze another wallet
      const { continueChoice } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueChoice',
          message: '\nAnalyze another wallet?',
          default: true,
        },
      ]);

      continueAnalyzing = continueChoice;

      if (continueAnalyzing) {
        console.clear();
      }
    } catch (error) {
      console.error(errorMessage('An unexpected error occurred:'), error);
      continueAnalyzing = false;
    }
  }

  // Goodbye message
  console.log(chalk.bold.green('\n👋 Thanks for using Fun Facts Analyzer!\n'));
  process.exit(0);
}

/**
 * Display a single fun fact result
 */
function displayResult(number: number, title: string, result: FunFact) {
  let content: string;

  switch (result.type) {
    case 'pnl':
      if (result.success && result.data) {
        const direction = result.data.status === 'GAIN' ? 'Up' : 'Down';
        const directionColor = result.data.status === 'GAIN' ? chalk.green : chalk.red;
        content = `My wallet P&L in the past year:\n${directionColor(direction + ' ' + formatPercentColored(result.data.realized_pnl_percent))}`;
      } else {
        content = warningMessage(result.fallback || 'No data available');
      }
      break;

    // DISABLED: Fun Fact #2 - Labels
    // case 'labels':
    //   if (result.success && result.data) {
    //     content = successMessage(`This wallet is labeled as: ${chalk.bold(result.data.label)}`);
    //   } else {
    //     content = infoMessage('No priority labels found for this wallet');
    //   }
    //   break;

    // DISABLED: Fun Fact #3 - Smart Money
    // case 'smart_money':
    //   if (result.success && result.data) {
    //     content = successMessage(
    //       `✨ Smart Money Detected! Labels: ${chalk.bold(result.data.labels.join(', '))}`
    //     );
    //   } else {
    //     content = infoMessage('Not identified as smart money trader');
    //   }
    //   break;

    case 'rugged_projects':
      if (result.success && result.data) {
        if (result.data.ruggedCount > 0) {
          const tokenWord = result.data.ruggedCount === 1 ? 'token' : 'tokens';
          const rugCount = chalk.red.bold(result.data.ruggedCount.toString());
          content = `I have ${rugCount} rugged ${tokenWord} as my battle scars`;
        } else {
          content = successMessage(result.fallback || 'No rugged projects detected—clear skies ahead');
        }
      } else {
        content = successMessage('No rugged projects detected—clear skies ahead');
      }
      break;

    case 'eth_benchmark':
      if (result.success && result.data) {
        const difference = result.data.portfolioValue - result.data.ethEquivalentValue;
        const direction = difference >= 0 ? 'Up' : 'Down';
        const directionColor = difference >= 0 ? chalk.green : chalk.red;
        const absDifference = Math.abs(difference);
        const absPercent = Math.abs(result.data.performancePercent);
        const percentColored = formatPercentColored(result.data.performancePercent);
        content = `If I traded everything in ETH:\n${directionColor(direction + ' ' + percentColored)}\n${chalk.dim('  (' + formatUSD(absDifference) + ' difference)')}`;
      } else {
        content = warningMessage(result.fallback || 'No data available');
      }
      break;

    case 'portfolio_ath':
      if (result.success && result.data) {
        const holdingsCount = result.data.sampleSize || 20;
        const athValueFormatted = formatUSD(result.data.athValue);
        const gainPercent = result.data.potentialGainPercent.toFixed(0);
        const gainPercentColored = formatPercentColored(result.data.potentialGainPercent);
        content = `If I cashed out my top ${holdingsCount} holdings at ATH:\n${chalk.green('Up ' + gainPercentColored)}\n${chalk.dim('  (' + athValueFormatted + ' total value)')}`;
      } else {
        content = warningMessage(result.fallback || 'No data available');
      }
      break;

    case 'win_rate':
      if (result.success && result.data) {
        const winRateColor = result.data.winRate >= 50 ? chalk.green : chalk.yellow;
        const winRateText = winRateColor(`${result.data.winRate.toFixed(0)}% Win Rate`);
        content = `My wallet win rate:\n${winRateText}`;
      } else {
        content = warningMessage(result.fallback || 'No data available');
      }
      break;

    // DISABLED: Fun Fact #8 - Biggest Bag
    // case 'biggest_bag':
    //   if (result.success && result.data) {
    //     content = successMessage(
    //       `${chalk.bold(result.data.tokenSymbol)} (${result.data.tokenName})\n  Value: ${formatUSD(result.data.valueUsd)} on ${result.data.chain}\n  ${result.data.percentOfPortfolio.toFixed(1)}% of your portfolio`
    //     );
    //   } else {
    //     content = infoMessage(result.fallback || 'No data available');
    //   }
    //   break;

    // DISABLED: Fun Fact #9 - Token Diversity
    // case 'token_diversity':
    //   if (result.success && result.data) {
    //     const scoreColor = 
    //       result.data.diversityScore === 'HIGH' ? chalk.green :
    //       result.data.diversityScore === 'MEDIUM' ? chalk.yellow :
    //       chalk.red;
    //     const scoreText = scoreColor(result.data.diversityScore);
    //     content = `Diversity Score: ${scoreText}\n  Holding ${result.data.uniqueTokens} unique tokens\n  Portfolio Value: ${formatUSD(result.data.totalValueUsd)}\n  Top 3 concentration: ${result.data.top3Concentration.toFixed(1)}%`;
    //   } else {
    //     content = infoMessage(result.fallback || 'No data available');
    //   }
    //   break;

    // DISABLED: Fun Fact #10 - Multi-Chain Explorer
    // case 'multi_chain':
    //   if (result.success && result.data) {
    //     const chainList = result.data.chains.slice(0, 5).join(', ');
    //     const moreChains = result.data.chains.length > 5 ? ` (+${result.data.chains.length - 5} more)` : '';
    //     content = successMessage(
    //       `🌐 Active on ${result.data.chainCount} chains!\n  Primary: ${chalk.bold(result.data.primaryChain)} (${result.data.primaryChainPercent.toFixed(1)}% of holdings)\n  Chains: ${chainList}${moreChains}`
    //     );
    //   } else {
    //     content = infoMessage(result.fallback || 'No data available');
    //   }
    //   break;

    default:
      content = infoMessage('Unknown fun fact type');
  }

  console.log(displayFunFact(number, title, content));
}

// Run the application
main().catch((error) => {
  console.error(errorMessage('Fatal error:'), error);
  process.exit(1);
});

