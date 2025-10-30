/**
 * x402 Facilitator Server Example
 * 
 * This example demonstrates how to run a facilitator server that provides
 * payment verification and settlement services for x402 protocol.
 * 
 * The facilitator implements the official Coinbase x402 spec:
 * - POST /verify   - Verify payment proof
 * - POST /settle   - Settle payment on-chain
 * - GET /supported - Get supported schemes
 */

import { X402Facilitator, NetworkConfig } from '../src';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Create wallet for facilitator (needs blockchain access)
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable required');
  }

  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('🏦 Starting x402 Facilitator Server');
  console.log(`   Wallet: ${wallet.address}`);

  // Create facilitator server
  const facilitator = new X402Facilitator({
    port: 8403,
    host: '0.0.0.0',
    wallet: wallet,
    supportedNetworks: [
      NetworkConfig.BASE_SEPOLIA,
      NetworkConfig.ETHEREUM_SEPOLIA,
      NetworkConfig.LINEA_SEPOLIA
    ]
  });

  // Start server
  facilitator.start();

  // Display stats
  console.log('\n📊 Facilitator Stats:');
  console.log(JSON.stringify(facilitator.getStats(), null, 2));

  console.log('\n💡 Test the endpoints:');
  console.log('   curl http://localhost:8403/supported');
  console.log('   curl -X POST http://localhost:8403/verify -H "Content-Type: application/json" -d \'{"x402Version":1,...}\'');
  console.log('   curl -X POST http://localhost:8403/settle -H "Content-Type: application/json" -d \'{"x402Version":1,...}\'');

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down facilitator server...');
    await facilitator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down facilitator server...');
    await facilitator.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Facilitator server error:', error);
  process.exit(1);
});

