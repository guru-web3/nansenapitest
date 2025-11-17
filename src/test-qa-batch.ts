#!/usr/bin/env node

import * as dotenv from 'dotenv';
dotenv.config();

import { validateAndNormalizeAddress, truncateAddress } from './utils/validation';
import { formatPercentColored, formatUSD } from './utils/formatting';
import { analyzePnl } from './features/pnl';
import { analyzeRuggedProjects } from './features/ruggedProjects';
import { analyzeEthBenchmark } from './features/ethBenchmark';
import { analyzePortfolioATH } from './features/portfolioATH';
import { analyzeWinRate } from './features/winRate';
import { FunFact } from './types';
import * as fs from 'fs';

interface QAResult {
  wallet: string;
  walletTruncated: string;
  pnl: string;
  ruggedProjects: string;
  ethBenchmark: string;
  portfolioATH: string;
  winRate: string;
  errors: string[];
}

const WALLET_ADDRESSES = [
  '0x00ba77ebeab5ff010a427fded060819ec3d79e88',
  '0x018cff34840fed037657f4683c5e50614419b6fe',
  '0x05d93ec016c4ae7a653fe79e6da7746073afb94f',
  '0x0695f4f5a1adddbf685645c4c22e01371b06a225',
  '0x074e1e77e665b04e9631a2de7422a1dcb5f8d4d7',
  '0x0774b7b442b6420db10a543763382140882a5a9b',
  '0x07d5f53b68e772e98b732beb5116b4fd38261cbb',
  '0x098acc2548c036c9baf30cb7713d13613e05b724',
  '0x106230d5be31022598903a4adb11c6e626bc2495',
  '0x117fff76beff447cd2e64830062beb90e4bbc1e2',
  '0x1feb94b090518f2bc6fadd9ee94a7dd8582ae1cc',
  '0x211cea4e6e15457f2e92c611714e7b11b0738055',
  '0x24d074530bb9526a67369b67fcf1fa6cf6ef6845',
  '0x25c30049b55de10f6b07f9ce27d78667957fecb8',
  '0x293d215cec854eb7af48fb53368e3ab7b9aee4c9',
  '0x2e1160819e566360d4a0d2ac9adb1d82c06f4bc4',
  '0x331e1ba82b52b88c5ac9f920be978b8f5c171d36',
  '0x3f2670cb9ad6b659054be345c31ed4cd931d2c42',
  '0x45c9235209a06bf8c8596c00b2934cf5aade091e',
  '0x4db07128b8bb18d39a8d55b3071d1fc442fe42d1',
  '0x5186fc0017a983c51b3845f0ed7800a4c23ad0b0',
  '0x54be3a794282c030b15e43ae2bb182e14c409c5e',
  '0x59b8d66167ff43aee7613aaffe0f397fd2a89d87',
  '0x5a052ad5a71c6f63d50e5bd786c797cb72d9c7d7',
  '0x5b34d7917840fac7e91973abdd5647ae5eeccbaa',
  '0x5d048ff914511d8673b6e2fcfb773fd98aa96183',
  '0x5da3d460742fbce2b8644b89784c1df5548ce4ac',
  '0x5e06f34db19ed365b1df342a963b75e9e638e10d',
  '0x5f3b3c00b9b2317c67bbd756ed15cc516f2dadac',
  '0x5fd583c3893aeaeb7a9dfe047d5cab95441c6621',
  '0x601c766b83476a0b330e34e0179b19b0fceb5601',
  '0x6313d7948d3491096ffe00dea2d246d588b4d4fc',
  '0x66ac08d6dd83a7819f51b997955a9ef3a8006429',
  '0x66c2808ff8e1dc28d27c93098d702da4c2f5d49b',
  '0x74582579cebffc7ae88c45f192003db51c1692cb',
  '0x7a3c8774c9b9eb076cfe6a62979ef10228084fbd',
  '0x7a93b5f60b67232b65684b489a17a96949169a09',
  '0x80c40c82586954751e1675aa58f7da346ae283f4',
  '0x833b32728794f53d51240f6dd7947aa8ea8001b0',
  '0x83d498de2ef7de7076768c0f5a660e9433f45b22',
  '0x8869a437c38f62d1d326fc87e800f779970b618d',
  '0x8d84aea6e5522d25a246f80c2f0f8082450a4ea2',
  '0x9235e8a894038fda2119c1f02e3afd78039807ae',
  '0x95b61beb8bb3f8b473c420f3355762808f09d828',
  '0x98806edd3264838597190e0ecc6c2bcd2b828aeb',
  '0x9aae2817363dbef803e25b5451a13d4fd0578fb2',
  '0xa003eb5e1727a188e7c0549a24dfeb1e5a0e2111',
  '0xad479007707a2091af0b8977884c6570a5646a4c',
  '0xb1a5b42808c2140804f5ce2e2dd2be0cee828513',
  '0xb47434e15396296672cdd34047d7e548c6aa396b',
  '0xb88c8ee3bd560bbd68ad80e0cdb9db8c10679889',
  '0xba943f9a82e378eac5c33bbc92263e82ee64f50b',
  '0xc19b8424ccf44a22013ed9abe6cbdae84c658c23',
  '0xd024771d8d25e8f90ef5749df9607f510affd223',
];

function formatResultForQA(result: FunFact): string {
  switch (result.type) {
    case 'pnl':
      if (result.success && result.data) {
        const direction = result.data.status === 'GAIN' ? 'Up' : 'Down';
        return `${direction} ${result.data.realized_pnl_percent.toFixed(2)}%`;
      } else {
        return result.fallback || 'No data';
      }

    case 'rugged_projects':
      if (result.success && result.data) {
        if (result.data.ruggedCount > 0) {
          return `${result.data.ruggedCount} rugged token${result.data.ruggedCount === 1 ? '' : 's'}`;
        } else {
          return '0 rugged tokens';
        }
      } else {
        return '0 rugged tokens';
      }

    case 'eth_benchmark':
      if (result.success && result.data) {
        const difference = result.data.portfolioValue - result.data.ethEquivalentValue;
        const direction = difference >= 0 ? 'Up' : 'Down';
        const absDifference = Math.abs(difference);
        const absPercent = Math.abs(result.data.performancePercent);
        return `${direction} ${absPercent.toFixed(2)}% ($${absDifference.toFixed(0)})`;
      } else {
        return result.fallback || 'No data';
      }

    case 'portfolio_ath':
      if (result.success && result.data) {
        return `Up ${result.data.potentialGainPercent.toFixed(2)}% ($${result.data.athValue.toFixed(0)} at ATH)`;
      } else {
        return result.fallback || 'No data';
      }

    case 'win_rate':
      if (result.success && result.data) {
        return `${result.data.winRate.toFixed(0)}% Win Rate`;
      } else {
        return result.fallback || 'No data';
      }

    default:
      return 'Unknown';
  }
}

async function analyzeWallet(address: string): Promise<QAResult> {
  const normalizedAddress = validateAndNormalizeAddress(address);
  const truncated = truncateAddress(normalizedAddress);
  const errors: string[] = [];

  console.log(`\n📊 Analyzing wallet: ${truncated} (${address})`);

  const [pnlResult, ruggedProjectsResult, ethBenchmarkResult, portfolioATHResult, winRateResult] =
    await Promise.all([
      analyzePnl(normalizedAddress).catch((err) => {
        errors.push(`P&L error: ${err.message}`);
        return {
          type: 'pnl' as const,
          success: false,
          fallback: 'Only mist—too little history to read.',
        };
      }),
      analyzeRuggedProjects(normalizedAddress).catch((err) => {
        errors.push(`Rugged projects error: ${err.message}`);
        return {
          type: 'rugged_projects' as const,
          success: true,
          data: { ruggedCount: 0, ruggedTokens: [] },
          fallback: 'No rugged projects detected',
        };
      }),
      analyzeEthBenchmark(normalizedAddress).catch((err) => {
        errors.push(`ETH benchmark error: ${err.message}`);
        return {
          type: 'eth_benchmark' as const,
          success: false,
          fallback: 'No meaningful history yet',
        };
      }),
      analyzePortfolioATH(normalizedAddress).catch((err) => {
        errors.push(`Portfolio ATH error: ${err.message}`);
        return {
          type: 'portfolio_ath' as const,
          success: false,
          fallback: 'No meaningful history yet',
        };
      }),
      analyzeWinRate(normalizedAddress).catch((err) => {
        errors.push(`Win rate error: ${err.message}`);
        return {
          type: 'win_rate' as const,
          success: false,
          fallback: 'Not enough trading history',
        };
      }),
    ]);

  return {
    wallet: normalizedAddress,
    walletTruncated: truncated,
    pnl: formatResultForQA(pnlResult),
    ruggedProjects: formatResultForQA(ruggedProjectsResult),
    ethBenchmark: formatResultForQA(ethBenchmarkResult),
    portfolioATH: formatResultForQA(portfolioATHResult),
    winRate: formatResultForQA(winRateResult),
    errors,
  };
}

function generateMarkdownTable(results: QAResult[]): string {
  let markdown = '# Fun Facts QA Results\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  markdown += `Total Wallets Tested: ${results.length}\n\n`;

  markdown += '## Results Table\n\n';
  markdown +=
    '| # | Wallet | P&L | Rugged Projects | ETH Benchmark | Portfolio ATH | Win Rate | Errors |\n';
  markdown +=
    '|---|--------|-----|-----------------|---------------|---------------|----------|--------|\n';

  results.forEach((result, index) => {
    const errorCount = result.errors.length > 0 ? `${result.errors.length} error(s)` : '✅';
    markdown += `| ${index + 1} | \`${result.walletTruncated}\` | ${result.pnl} | ${result.ruggedProjects} | ${result.ethBenchmark} | ${result.portfolioATH} | ${result.winRate} | ${errorCount} |\n`;
  });

  markdown += '\n## Detailed Results\n\n';
  results.forEach((result, index) => {
    markdown += `### ${index + 1}. Wallet: \`${result.wallet}\`\n\n`;
    markdown += `- **P&L**: ${result.pnl}\n`;
    markdown += `- **Rugged Projects**: ${result.ruggedProjects}\n`;
    markdown += `- **ETH Benchmark**: ${result.ethBenchmark}\n`;
    markdown += `- **Portfolio ATH**: ${result.portfolioATH}\n`;
    markdown += `- **Win Rate**: ${result.winRate}\n`;

    if (result.errors.length > 0) {
      markdown += `- **Errors**:\n`;
      result.errors.forEach((error) => {
        markdown += `  - ${error}\n`;
      });
    }
    markdown += '\n';
  });

  return markdown;
}

function generateCSV(results: QAResult[]): string {
  let csv = 'Wallet Address,Truncated,P&L,Rugged Projects,ETH Benchmark,Portfolio ATH,Win Rate,Error Count\n';

  results.forEach((result) => {
    const errorCount = result.errors.length;
    csv += `"${result.wallet}","${result.walletTruncated}","${result.pnl}","${result.ruggedProjects}","${result.ethBenchmark}","${result.portfolioATH}","${result.winRate}",${errorCount}\n`;
  });

  return csv;
}

async function main() {
  console.log('🚀 Starting QA Batch Testing');
  console.log(`📋 Testing ${WALLET_ADDRESSES.length} wallets\n`);

  const results: QAResult[] = [];

  for (let i = 0; i < WALLET_ADDRESSES.length; i++) {
    const address = WALLET_ADDRESSES[i];
    console.log(`\n[${i + 1}/${WALLET_ADDRESSES.length}] Processing: ${address}`);

    try {
      const result = await analyzeWallet(address);
      results.push(result);

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to analyze wallet ${address}:`, error);
      results.push({
        wallet: address,
        walletTruncated: truncateAddress(address),
        pnl: 'ERROR',
        ruggedProjects: 'ERROR',
        ethBenchmark: 'ERROR',
        portfolioATH: 'ERROR',
        winRate: 'ERROR',
        errors: [(error as Error).message],
      });
    }
  }

  console.log('\n\n✅ Analysis Complete! Generating reports...\n');

  // Generate and save Markdown report
  const markdownReport = generateMarkdownTable(results);
  fs.writeFileSync('QA_RESULTS.md', markdownReport);
  console.log('📄 Markdown report saved: QA_RESULTS.md');

  // Generate and save CSV report
  const csvReport = generateCSV(results);
  fs.writeFileSync('QA_RESULTS.csv', csvReport);
  console.log('📊 CSV report saved: QA_RESULTS.csv');

  // Generate summary statistics
  const successCount = results.filter((r) => r.errors.length === 0).length;
  const errorCount = results.filter((r) => r.errors.length > 0).length;

  console.log('\n📊 Summary Statistics:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ With Errors: ${errorCount}`);
  console.log(`   📈 Success Rate: ${((successCount / results.length) * 100).toFixed(2)}%`);

  console.log('\n🎉 QA Testing Complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

