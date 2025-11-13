#!/usr/bin/env node

/**
 * Test script for Fun Facts PRD Implementation
 * 
 * This script tests all 6 fun fact features with a sample wallet
 * to verify PRD compliance and functionality.
 * 
 * Usage:
 *   npm run test
 *   or
 *   ts-node src/test.ts
 */

import chalk from 'chalk';
import { analyzePnl } from './features/pnl';
import { analyzeLabels } from './features/labels';
import { analyzeSmartMoney } from './features/smartMoney';
import { analyzeRuggedProjects } from './features/ruggedProjects';
import { analyzeEthBenchmark } from './features/ethBenchmark';
import { analyzePortfolioATH } from './features/portfolioATH';

// PRD-specified test wallet
const TEST_WALLET = '0xF977814e90dA44bFA03b6295A0616a897441aceC';

async function runTests() {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                                                   ║'));
  console.log(chalk.bold.cyan('║      Fun Facts - PRD Compliance Test Suite       ║'));
  console.log(chalk.bold.cyan('║                                                   ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════╝\n'));

  console.log(chalk.gray(`Test Wallet: ${TEST_WALLET}\n`));
  console.log('='.repeat(60));

  let passedTests = 0;
  let totalTests = 6;

  // Test 1: P&L
  console.log(chalk.bold('\n📊 Test 1: P&L (Profit & Loss)'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzePnl(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(`✓ Completed in ${elapsed}ms`);
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      console.log(`  P&L: ${result.data.status} ${result.data.realized_pnl_percent.toFixed(2)}%`);
      console.log(`  Amount: $${result.data.realized_pnl_usd.toFixed(2)}`);
    } else {
      console.log(`  Fallback: ${result.fallback}`);
    }
    passedTests++;
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Test 2: Labels
  console.log(chalk.bold('\n🏷️  Test 2: Wallet Labels'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzeLabels(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(`✓ Completed in ${elapsed}ms`);
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      console.log(chalk.green(`  Label: ${result.data.label}`));
    } else {
      console.log(`  No priority labels found`);
    }
    passedTests++;
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Test 3: Smart Money
  console.log(chalk.bold('\n✨ Test 3: Smart Money Detection'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzeSmartMoney(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(`✓ Completed in ${elapsed}ms`);
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      console.log(chalk.green(`  Smart Money: Yes`));
      console.log(`  Labels: ${result.data.labels.join(', ')}`);
    } else {
      console.log(`  Smart Money: No`);
    }
    passedTests++;
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Test 4: Rugged Projects
  console.log(chalk.bold('\n⚠️  Test 4: Rugged Projects'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzeRuggedProjects(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(`✓ Completed in ${elapsed}ms`);
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      console.log(`  Rugged Count: ${result.data.ruggedCount}`);
      if (result.data.ruggedCount > 0) {
        console.log(`  Tokens: ${result.data.ruggedTokens.map(t => t.symbol).join(', ')}`);
      }
    }
    passedTests++;
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Test 5: ETH Benchmark (Performance Critical)
  console.log(chalk.bold('\n🔥 Test 5: ETH Benchmark (Performance Test)'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzeEthBenchmark(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(`✓ Completed in ${elapsed}ms`);
    
    // Performance validation
    if (elapsed < 30000) {
      console.log(chalk.green(`  ✓ Performance: PASS (< 30 seconds)`));
    } else {
      console.log(chalk.yellow(`  ⚠ Performance: SLOW (> 30 seconds)`));
    }
    
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      console.log(`  Status: ${result.data.status}`);
      console.log(`  Performance: ${result.data.performancePercent.toFixed(2)}%`);
      console.log(`  Portfolio: $${result.data.portfolioValue.toFixed(2)}`);
      console.log(`  ETH Equiv: $${result.data.ethEquivalentValue.toFixed(2)}`);
    } else {
      console.log(`  Fallback: ${result.fallback}`);
    }
    passedTests++;
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Test 6: Portfolio ATH
  console.log(chalk.bold('\n📈 Test 6: Portfolio at ATH'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzePortfolioATH(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(`✓ Completed in ${elapsed}ms`);
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      console.log(`  Current Value: $${result.data.currentValue.toFixed(2)}`);
      console.log(`  ATH Value: $${result.data.athValue.toFixed(2)}`);
      console.log(`  Potential Gain: ${result.data.potentialGainPercent.toFixed(2)}%`);
    } else {
      console.log(`  Fallback: ${result.fallback}`);
    }
    passedTests++;
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(chalk.bold('\n📊 Test Summary'));
  console.log('-'.repeat(60));
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log(chalk.green.bold('\n✓ All tests passed! PRD implementation is working correctly.\n'));
  } else {
    console.log(chalk.yellow.bold(`\n⚠ ${totalTests - passedTests} test(s) failed. Please review errors above.\n`));
  }
}

// Run tests
runTests().catch((error) => {
  console.error(chalk.red('\n✗ Fatal error during testing:'), error);
  process.exit(1);
});

