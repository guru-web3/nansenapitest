import 'dotenv/config';
import { analyzeEthBenchmark } from './features/ethBenchmark';
import { analyzePortfolioATH } from './features/portfolioATH';
import chalk from 'chalk';

// Test wallet address (previously tested)
const TEST_ADDRESS = '0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC';

async function testPerformance() {
  console.log(chalk.bold('\n🚀 Performance Test - Optimized Fun Facts\n'));
  console.log(`Testing wallet: ${chalk.cyan(TEST_ADDRESS)}\n`);
  
  // Test ETH Benchmark
  console.log(chalk.bold('📊 Testing Fun Fact #5: ETH Benchmark'));
  console.log(chalk.dim('Expected: < 3 seconds\n'));
  
  const ethBenchmarkStart = Date.now();
  const ethBenchmarkResult = await analyzeEthBenchmark(TEST_ADDRESS);
  const ethBenchmarkTime = (Date.now() - ethBenchmarkStart) / 1000;
  
  if (ethBenchmarkResult.success && ethBenchmarkResult.data) {
    console.log(chalk.green('✅ ETH Benchmark SUCCESS'));
    console.log(`   Status: ${ethBenchmarkResult.data.status}`);
    console.log(`   Performance: ${ethBenchmarkResult.data.performancePercent.toFixed(2)}%`);
    console.log(`   Sample: ${ethBenchmarkResult.data.sampleSize}/${ethBenchmarkResult.data.totalTransactions} transactions`);
    console.log(chalk.bold(`   ⏱️  Time: ${ethBenchmarkTime.toFixed(2)}s`));
    
    if (ethBenchmarkTime < 3) {
      console.log(chalk.green(`   🎯 PASSED: Under 3 second target`));
    } else {
      console.log(chalk.yellow(`   ⚠️  WARNING: Over 3 second target`));
    }
  } else {
    console.log(chalk.red('❌ ETH Benchmark FAILED'));
    console.log(`   Fallback: ${ethBenchmarkResult.fallback}`);
    console.log(chalk.bold(`   ⏱️  Time: ${ethBenchmarkTime.toFixed(2)}s`));
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Test Portfolio ATH
  console.log(chalk.bold('📊 Testing Fun Fact #6: Portfolio ATH'));
  console.log(chalk.dim('Expected: < 3 seconds\n'));
  
  const portfolioATHStart = Date.now();
  const portfolioATHResult = await analyzePortfolioATH(TEST_ADDRESS);
  const portfolioATHTime = (Date.now() - portfolioATHStart) / 1000;
  
  if (portfolioATHResult.success && portfolioATHResult.data) {
    console.log(chalk.green('✅ Portfolio ATH SUCCESS'));
    console.log(`   Current Value: $${portfolioATHResult.data.currentValue.toFixed(2)}`);
    console.log(`   ATH Value: $${portfolioATHResult.data.athValue.toFixed(2)}`);
    console.log(`   Potential Gain: ${portfolioATHResult.data.potentialGainPercent.toFixed(2)}%`);
    console.log(`   Sample: ${portfolioATHResult.data.sampleSize} holdings, ${portfolioATHResult.data.successfulTokens} with ATH data`);
    console.log(chalk.bold(`   ⏱️  Time: ${portfolioATHTime.toFixed(2)}s`));
    
    if (portfolioATHTime < 3) {
      console.log(chalk.green(`   🎯 PASSED: Under 3 second target`));
    } else {
      console.log(chalk.yellow(`   ⚠️  WARNING: Over 3 second target`));
    }
  } else {
    console.log(chalk.red('❌ Portfolio ATH FAILED'));
    console.log(`   Fallback: ${portfolioATHResult.fallback}`);
    console.log(chalk.bold(`   ⏱️  Time: ${portfolioATHTime.toFixed(2)}s`));
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Summary
  const totalTime = ethBenchmarkTime + portfolioATHTime;
  console.log(chalk.bold('📈 PERFORMANCE SUMMARY\n'));
  console.log(`ETH Benchmark: ${ethBenchmarkTime.toFixed(2)}s ${ethBenchmarkTime < 3 ? chalk.green('✓') : chalk.yellow('⚠')}`);
  console.log(`Portfolio ATH: ${portfolioATHTime.toFixed(2)}s ${portfolioATHTime < 3 ? chalk.green('✓') : chalk.yellow('⚠')}`);
  console.log(chalk.bold(`Total Time: ${totalTime.toFixed(2)}s`));
  
  if (totalTime < 6) {
    console.log(chalk.green.bold(`\n🎉 EXCELLENT: Combined time under 6 second target!`));
  } else if (totalTime < 10) {
    console.log(chalk.yellow.bold(`\n⚠️  GOOD: Combined time acceptable but over target`));
  } else {
    console.log(chalk.red.bold(`\n❌ NEEDS IMPROVEMENT: Combined time too slow`));
  }
  
  console.log('\n');
}

// Run the test
testPerformance()
  .then(() => {
    console.log('✨ Performance test complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });

