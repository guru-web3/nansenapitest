#!/usr/bin/env node

/**
 * Test script for new fun facts features
 * Tests: Win Rate, Biggest Bag, Token Diversity, Multi-Chain
 */

import chalk from 'chalk';
import { analyzeWinRate } from './features/winRate';
import { analyzeBiggestBag } from './features/biggestBag';
import { analyzeTokenDiversity } from './features/tokenDiversity';
import { analyzeMultiChain } from './features/multiChain';

// Test wallet with known activity
const TEST_WALLET = '0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC';

async function testNewFeatures() {
  console.log(chalk.bold.cyan('\n🧪 Testing New Fun Facts Features\n'));
  console.log(chalk.gray(`Test Wallet: ${TEST_WALLET}\n`));
  console.log(chalk.gray('=' .repeat(60) + '\n'));

  try {
    // Test 1: Win Rate Champion
    console.log(chalk.bold.yellow('1️⃣  Testing Win Rate Champion...'));
    const winRateResult = await analyzeWinRate(TEST_WALLET);
    console.log(chalk.gray('Result:'), JSON.stringify(winRateResult, null, 2));
    
    if (winRateResult.success && winRateResult.data) {
      console.log(chalk.green('✅ Win Rate: Success'));
      console.log(chalk.cyan(`   - Win Rate: ${winRateResult.data.winRate.toFixed(1)}%`));
      console.log(chalk.cyan(`   - Traded Tokens: ${winRateResult.data.tradedTokens}`));
      console.log(chalk.cyan(`   - Traded Times: ${winRateResult.data.tradedTimes}`));
      if (winRateResult.data.bestToken) {
        console.log(chalk.cyan(`   - Best Token: ${winRateResult.data.bestToken.symbol} (ROI: ${winRateResult.data.bestToken.roi.toFixed(1)}%)`));
      }
    } else {
      console.log(chalk.yellow('⚠️  Win Rate: No data'));
      console.log(chalk.gray(`   - Fallback: ${winRateResult.fallback}`));
    }
    console.log();

    // Test 2: Biggest Bag
    console.log(chalk.bold.yellow('2️⃣  Testing Biggest Bag...'));
    const biggestBagResult = await analyzeBiggestBag(TEST_WALLET);
    console.log(chalk.gray('Result:'), JSON.stringify(biggestBagResult, null, 2));
    
    if (biggestBagResult.success && biggestBagResult.data) {
      console.log(chalk.green('✅ Biggest Bag: Success'));
      console.log(chalk.cyan(`   - Token: ${biggestBagResult.data.tokenSymbol} (${biggestBagResult.data.tokenName})`));
      console.log(chalk.cyan(`   - Value: $${biggestBagResult.data.valueUsd.toFixed(2)}`));
      console.log(chalk.cyan(`   - Chain: ${biggestBagResult.data.chain}`));
      console.log(chalk.cyan(`   - Portfolio %: ${biggestBagResult.data.percentOfPortfolio.toFixed(1)}%`));
    } else {
      console.log(chalk.yellow('⚠️  Biggest Bag: No data'));
      console.log(chalk.gray(`   - Fallback: ${biggestBagResult.fallback}`));
    }
    console.log();

    // Test 3: Token Diversity
    console.log(chalk.bold.yellow('3️⃣  Testing Token Diversity...'));
    const tokenDiversityResult = await analyzeTokenDiversity(TEST_WALLET);
    console.log(chalk.gray('Result:'), JSON.stringify(tokenDiversityResult, null, 2));
    
    if (tokenDiversityResult.success && tokenDiversityResult.data) {
      console.log(chalk.green('✅ Token Diversity: Success'));
      console.log(chalk.cyan(`   - Unique Tokens: ${tokenDiversityResult.data.uniqueTokens}`));
      console.log(chalk.cyan(`   - Total Value: $${tokenDiversityResult.data.totalValueUsd.toFixed(2)}`));
      console.log(chalk.cyan(`   - Top 3 Concentration: ${tokenDiversityResult.data.top3Concentration.toFixed(1)}%`));
      console.log(chalk.cyan(`   - Diversity Score: ${tokenDiversityResult.data.diversityScore}`));
    } else {
      console.log(chalk.yellow('⚠️  Token Diversity: No data'));
      console.log(chalk.gray(`   - Fallback: ${tokenDiversityResult.fallback}`));
    }
    console.log();

    // Test 4: Multi-Chain Explorer
    console.log(chalk.bold.yellow('4️⃣  Testing Multi-Chain Explorer...'));
    const multiChainResult = await analyzeMultiChain(TEST_WALLET);
    console.log(chalk.gray('Result:'), JSON.stringify(multiChainResult, null, 2));
    
    if (multiChainResult.success && multiChainResult.data) {
      console.log(chalk.green('✅ Multi-Chain: Success'));
      console.log(chalk.cyan(`   - Active Chains: ${multiChainResult.data.chainCount}`));
      console.log(chalk.cyan(`   - Primary Chain: ${multiChainResult.data.primaryChain} (${multiChainResult.data.primaryChainPercent.toFixed(1)}%)`));
      console.log(chalk.cyan(`   - Chains: ${multiChainResult.data.chains.join(', ')}`));
    } else {
      console.log(chalk.yellow('⚠️  Multi-Chain: No data'));
      console.log(chalk.gray(`   - Fallback: ${multiChainResult.fallback}`));
    }
    console.log();

    // Summary
    console.log(chalk.gray('=' .repeat(60)));
    console.log(chalk.bold.green('\n✨ Test Summary'));
    const results = [winRateResult, biggestBagResult, tokenDiversityResult, multiChainResult];
    const successCount = results.filter(r => r.success).length;
    console.log(chalk.cyan(`${successCount}/4 features returned data successfully`));
    
    if (successCount === 4) {
      console.log(chalk.green('\n🎉 All tests passed! All new features are working correctly.\n'));
    } else if (successCount > 0) {
      console.log(chalk.yellow('\n⚠️  Some features working. This may be due to wallet characteristics.\n'));
    } else {
      console.log(chalk.red('\n❌ No features returned data. Check API connection and wallet data.\n'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error during testing:'), error);
    process.exit(1);
  }
}

// Run tests
testNewFeatures().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});



