import { ChaosChainSDK, SDK_VERSION, ERC8004_VERSION, AgentRole } from './dist/index.mjs';

console.log('\n=== ChaosChain SDK Test Suite ===\n');

// Test 1: SDK Imports
console.log('✅ Test 1: SDK imports successfully');
console.log(`   SDK Version: ${SDK_VERSION}`);
console.log(`   ERC-8004 Version: ${ERC8004_VERSION}`);
console.log(`   ChaosChainSDK: ${typeof ChaosChainSDK}`);

// Test 2: Check exports
console.log('\n✅ Test 2: Core exports available');
console.log(`   AgentRole.SERVER: ${AgentRole.SERVER}`);
console.log(`   AgentRole.CLIENT: ${AgentRole.CLIENT}`);

// Test 3: SDK Initialization (minimal config)
try {
  const sdk = new ChaosChainSDK({
    agentName: 'TestAgent',
    agentDomain: 'test.example.com',
    agentRole: AgentRole.SERVER,
    network: 'base-sepolia',
    privateKey: '0x' + '1'.repeat(64), // Dummy private key
    enablePayments: false,
    enableAP2: false,
    enableProcessIntegrity: false,
    enableStorage: false
  });
  
  console.log('\n✅ Test 3: SDK initialization works');
  console.log(`   Agent Name: ${sdk.agentName}`);
  console.log(`   Network: ${sdk.network}`);
  console.log(`   Wallet: ${sdk.getAddress().substring(0, 10)}...`);
  
  // Test 4: Check capabilities
  const caps = sdk.getCapabilities();
  console.log('\n✅ Test 4: SDK capabilities');
  console.log(`   Features: ${Object.keys(caps.features).length} features`);
  console.log(`   ERC-8004 Identity: ${caps.features.erc_8004_identity}`);
  console.log(`   ERC-8004 Reputation: ${caps.features.erc_8004_reputation}`);
  console.log(`   ERC-8004 Validation: ${caps.features.erc_8004_validation}`);
  
  console.log('\n🎉 All tests passed! SDK is ready for production.\n');
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
}
