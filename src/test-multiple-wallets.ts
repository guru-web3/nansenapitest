#!/usr/bin/env node

import chalk from 'chalk';
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

const WALLETS = [
  '0x22F7406101f90771d5bb3E930195cCc6700cC583',
  '0x5648B4f63359dd5C901d0CB801a3CB2F030C0625',
  '0x952b65Cb452fd82225c9E92DFf353e975aE398B4',
  '0x435dd9d601482314226b14df84ec4050ba2aaeb7',
  '0xb967d330bd47a45b0746025ba3cf76b8a9988106',
  '0x586ca92c4AB530f9F9b686aD754e1274702C037f',
];

interface WalletResults {
  wallet: string;
  timing: number;
  pnl: any;
  // labels: any; // DISABLED: Fun Fact #2
  // smartMoney: any; // DISABLED: Fun Fact #3
  rugged: any;
  ethBench: any;
  portfolioATH: any;
  winRate: any;
  // biggestBag: any; // DISABLED: Fun Fact #8
  // diversity: any; // DISABLED: Fun Fact #9
  // multiChain: any; // DISABLED: Fun Fact #10
}

async function analyzeWallet(address: string): Promise<WalletResults> {
  const startTime = Date.now();
  
  const [
    pnl, rugged, ethBench, portfolioATH, winRate
  ] = await Promise.all([
    analyzePnl(address).catch(() => ({ type: 'pnl' as const, success: false })),
    // analyzeLabels(address).catch(() => ({ type: 'labels' as const, success: false })), // DISABLED
    // analyzeSmartMoney(address).catch(() => ({ type: 'smart_money' as const, success: false })), // DISABLED
    analyzeRuggedProjects(address).catch(() => ({ type: 'rugged_projects' as const, success: false })),
    analyzeEthBenchmark(address).catch(() => ({ type: 'eth_benchmark' as const, success: false })),
    analyzePortfolioATH(address).catch(() => ({ type: 'portfolio_ath' as const, success: false })),
    analyzeWinRate(address).catch(() => ({ type: 'win_rate' as const, success: false })),
    // analyzeBiggestBag(address).catch(() => ({ type: 'biggest_bag' as const, success: false })), // DISABLED
    // analyzeTokenDiversity(address).catch(() => ({ type: 'token_diversity' as const, success: false })), // DISABLED
    // analyzeMultiChain(address).catch(() => ({ type: 'multi_chain' as const, success: false })), // DISABLED
  ]);

  const timing = (Date.now() - startTime) / 1000;

  return {
    wallet: address,
    timing,
    pnl,
    // labels, // DISABLED
    // smartMoney, // DISABLED
    rugged,
    ethBench,
    portfolioATH,
    winRate,
    // biggestBag, // DISABLED
    // diversity, // DISABLED
    // multiChain, // DISABLED
  };
}

function formatValue(result: any): string {
  if (!result.success) return '—';
  
  switch (result.type) {
    case 'pnl':
      if (result.data) {
        const sign = result.data.realized_pnl_usd >= 0 ? '+' : '';
        return `${sign}${result.data.realized_pnl_percent.toFixed(1)}% ($${Math.abs(result.data.realized_pnl_usd).toFixed(0)})`;
      }
      return '—';
    
    // DISABLED: Fun Fact #2 - Labels
    // case 'labels':
    //   return result.data ? result.data.label : 'None';
    
    // DISABLED: Fun Fact #3 - Smart Money
    // case 'smart_money':
    //   return result.data ? 'Yes' : 'No';
    
    case 'rugged_projects':
      if (result.data && result.data.ruggedCount > 0) {
        return `${result.data.ruggedCount} (-$${Math.abs(result.data.totalLoss || 0).toFixed(0)})`;
      }
      return '0';
    
    case 'eth_benchmark':
      if (result.data) {
        const sign = result.data.performancePercent >= 0 ? '+' : '';
        return `${sign}${result.data.performancePercent.toFixed(1)}%`;
      }
      return '—';
    
    case 'portfolio_ath':
      if (result.data) {
        return `+${result.data.potentialGainPercent.toFixed(0)}%`;
      }
      return '—';
    
    case 'win_rate':
      if (result.data) {
        return `${result.data.winRate.toFixed(1)}%`;
      }
      return '—';
    
    // DISABLED: Fun Fact #8 - Biggest Bag
    // case 'biggest_bag':
    //   if (result.data) {
    //     return `${result.data.tokenSymbol} (${result.data.percentOfPortfolio.toFixed(0)}%)`;
    //   }
    //   return '—';
    
    // DISABLED: Fun Fact #9 - Token Diversity
    // case 'token_diversity':
    //   if (result.data) {
    //     return `${result.data.diversityScore} (${result.data.uniqueTokens} tokens)`;
    //   }
    //   return '—';
    
    // DISABLED: Fun Fact #10 - Multi-Chain Explorer
    // case 'multi_chain':
    //   if (result.data) {
    //     return `${result.data.chainCount} chains`;
    //   }
    //   return '—';
    
    default:
      return '—';
  }
}

async function main() {
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                                                            ║'));
  console.log(chalk.bold.cyan('║     🎲 Multi-Wallet Analysis - 6 Wallets × 5 Facts 🎲    ║'));
  console.log(chalk.bold.cyan('║                                                            ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════╝\n'));

  const totalStartTime = Date.now();
  const results: WalletResults[] = [];

  for (let i = 0; i < WALLETS.length; i++) {
    const wallet = WALLETS[i];
    console.log(chalk.yellow(`\n[${i + 1}/${WALLETS.length}] Analyzing ${wallet.substring(0, 10)}...${wallet.substring(38)}`));
    
    const result = await analyzeWallet(wallet);
    results.push(result);
    
    console.log(chalk.green(`✓ Completed in ${result.timing.toFixed(1)}s`));
  }

  const totalTime = (Date.now() - totalStartTime) / 1000;

  // Display results table
  console.log(chalk.bold.cyan('\n\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                   RESULTS SUMMARY TABLE                    ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════╝\n'));

  // Header
  console.log(chalk.bold('Wallet Analysis Results:'));
  console.log('─'.repeat(80));
  console.log(
    chalk.bold.white('Wallet'.padEnd(15)) + ' │ ' +
    chalk.bold.white('Time'.padEnd(6)) + ' │ ' +
    chalk.bold.white('P&L'.padEnd(20)) + ' │ ' +
    // chalk.bold.white('Label'.padEnd(18)) + ' │ ' + // DISABLED
    // chalk.bold.white('Smart$'.padEnd(6)) + ' │ ' + // DISABLED
    chalk.bold.white('Rugs'.padEnd(12))
  );
  console.log('─'.repeat(80));

  results.forEach((r) => {
    const shortAddr = `${r.wallet.substring(0, 6)}...${r.wallet.substring(38)}`;
    console.log(
      shortAddr.padEnd(15) + ' │ ' +
      `${r.timing.toFixed(1)}s`.padEnd(6) + ' │ ' +
      formatValue(r.pnl).padEnd(20) + ' │ ' +
      // formatValue(r.labels).substring(0, 18).padEnd(18) + ' │ ' + // DISABLED
      // formatValue(r.smartMoney).padEnd(6) + ' │ ' + // DISABLED
      formatValue(r.rugged).padEnd(12)
    );
  });

  console.log('─'.repeat(80));
  console.log('\n');

  console.log(chalk.bold('Trading Performance:'));
  console.log('─'.repeat(70));
  console.log(
    chalk.bold.white('Wallet'.padEnd(15)) + ' │ ' +
    chalk.bold.white('ETH Bench'.padEnd(12)) + ' │ ' +
    chalk.bold.white('Win Rate'.padEnd(10)) + ' │ ' +
    chalk.bold.white('Portfolio ATH'.padEnd(15))
    // chalk.bold.white('Biggest Bag'.padEnd(25)) // DISABLED
  );
  console.log('─'.repeat(70));

  results.forEach((r) => {
    const shortAddr = `${r.wallet.substring(0, 6)}...${r.wallet.substring(38)}`;
    console.log(
      shortAddr.padEnd(15) + ' │ ' +
      formatValue(r.ethBench).padEnd(12) + ' │ ' +
      formatValue(r.winRate).padEnd(10) + ' │ ' +
      formatValue(r.portfolioATH).padEnd(15)
      // formatValue(r.biggestBag).substring(0, 25).padEnd(25) // DISABLED
    );
  });

  console.log('─'.repeat(70));
  console.log('\n');

  // DISABLED: Portfolio Composition table - all fields are disabled
  // console.log(chalk.bold('Portfolio Composition:'));
  // console.log('─'.repeat(120));
  // console.log(
  //   chalk.bold.white('Wallet'.padEnd(15)) + ' │ ' +
  //   chalk.bold.white('Diversity'.padEnd(25)) + ' │ ' +
  //   chalk.bold.white('Multi-Chain'.padEnd(15))
  // );
  // console.log('─'.repeat(120));

  // results.forEach((r) => {
  //   const shortAddr = `${r.wallet.substring(0, 6)}...${r.wallet.substring(38)}`;
  //   console.log(
  //     shortAddr.padEnd(15) + ' │ ' +
  //     formatValue(r.diversity).padEnd(25) + ' │ ' +
  //     formatValue(r.multiChain).padEnd(15)
  //   );
  // });

  console.log('─'.repeat(120));

  // Timing summary
  console.log(chalk.bold.cyan('\n\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                    TIMING ANALYSIS                         ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════╝\n'));

  const avgTime = results.reduce((sum, r) => sum + r.timing, 0) / results.length;
  const minTime = Math.min(...results.map(r => r.timing));
  const maxTime = Math.max(...results.map(r => r.timing));

  console.log(chalk.white(`Total Wallets Analyzed: ${chalk.bold(WALLETS.length)}`));
  console.log(chalk.white(`Total Time: ${chalk.bold(totalTime.toFixed(1))}s`));
  console.log(chalk.white(`Average Time per Wallet: ${chalk.bold(avgTime.toFixed(1))}s`));
  console.log(chalk.white(`Fastest Analysis: ${chalk.bold(minTime.toFixed(1))}s`));
  console.log(chalk.white(`Slowest Analysis: ${chalk.bold(maxTime.toFixed(1))}s`));
  console.log(chalk.white(`Throughput: ${chalk.bold((WALLETS.length / totalTime * 60).toFixed(1))} wallets/minute`));

  // Success rate
  console.log(chalk.bold.cyan('\n\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                    SUCCESS METRICS                         ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════╝\n'));

  const features = ['pnl', 'rugged', 'ethBench', 'portfolioATH', 'winRate'];
  const featureNames = ['P&L', 'Rugged Projects', 'ETH Benchmark', 'Portfolio ATH', 'Win Rate'];
  // DISABLED: 'labels', 'smartMoney', 'biggestBag', 'diversity', 'multiChain'

  features.forEach((feature, idx) => {
    const successCount = results.filter(r => (r as any)[feature].success).length;
    const successRate = (successCount / WALLETS.length * 100).toFixed(0);
    console.log(`${featureNames[idx].padEnd(20)}: ${successCount}/${WALLETS.length} (${successRate}%)`);
  });

  console.log(chalk.bold.green('\n✨ Analysis Complete!\n'));
}

main().catch(console.error);



