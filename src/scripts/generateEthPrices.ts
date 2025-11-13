import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { subYears, addDays, format } from 'date-fns';
import { CoinGeckoService } from '../services/coingecko.service';

const coinGeckoService = new CoinGeckoService();

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generatePriceDatabase() {
  console.log('🚀 Starting ETH price data generation...');
  console.log('📅 Fetching 365 days of historical ETH prices\n');
  
  const prices: Record<string, number> = {};
  const startDate = subYears(new Date(), 1);
  const days = 365;
  const delayMs = 1500; // Stay under rate limit
  
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    try {
      const price = await coinGeckoService.getHistoricalPrice('ethereum', date);
      
      if (price && price > 0) {
        prices[dateKey] = price;
        successCount++;
        
        // Progress indicator every 10 days
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Progress: ${i + 1}/${days} days (${successCount} successful)`);
        }
      } else {
        failureCount++;
        console.log(`⚠️  No price data for ${dateKey}`);
      }
      
      // Rate limiting delay
      if (i < days - 1) {
        await delay(delayMs);
      }
    } catch (error) {
      failureCount++;
      console.error(`❌ Failed to fetch price for ${dateKey}:`, error instanceof Error ? error.message : 'Unknown error');
      
      // Continue with delay
      if (i < days - 1) {
        await delay(delayMs);
      }
    }
  }
  
  // Save to file
  const dataDir = path.join(__dirname, '../../src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const outputPath = path.join(dataDir, 'eth-prices.json');
  fs.writeFileSync(outputPath, JSON.stringify(prices, null, 2));
  
  console.log('\n🎉 Price database generated successfully!');
  console.log(`📊 Total dates: ${Object.keys(prices).length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`💾 Saved to: ${outputPath}`);
  
  // Show sample data
  const sampleDates = Object.keys(prices).slice(0, 5);
  console.log('\n📈 Sample data:');
  sampleDates.forEach(date => {
    console.log(`  ${date}: $${prices[date].toFixed(2)}`);
  });
}

// Run the script
generatePriceDatabase()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

