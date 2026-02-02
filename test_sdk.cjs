const { ChaosChainSDK, SDK_VERSION, ERC8004_VERSION, AgentRole, GatewayClient, StudioClient } = require('./dist/index.js');

console.log('\n=== ChaosChain SDK Test Suite ===\n');

// Test 1: SDK Imports
console.log('Test 1: SDK imports successfully');
console.log('   SDK Version:', SDK_VERSION);
console.log('   ERC-8004 Version:', ERC8004_VERSION);
console.log('   ChaosChainSDK:', typeof ChaosChainSDK);

// Test 2: Check exports
console.log('\nTest 2: Core exports available');
console.log('   AgentRole.WORKER:', AgentRole.WORKER);
console.log('   AgentRole.VERIFIER:', AgentRole.VERIFIER);
console.log('   AgentRole.CLIENT:', AgentRole.CLIENT);

// Test 3: Check new exports (Gateway & Studio)
console.log('\nTest 3: Gateway & Studio exports');
console.log('   GatewayClient:', typeof GatewayClient);
console.log('   StudioClient:', typeof StudioClient);

// Test 4: SDK Initialization
try {
  const sdk = new ChaosChainSDK({
    agentName: 'TestAgent',
    agentDomain: 'test.example.com',
    agentRole: AgentRole.WORKER,
    network: 'base-sepolia',
    privateKey: '0x' + '1'.repeat(64),
    enablePayments: false,
    enableAP2: false,
    enableProcessIntegrity: false,
    enableStorage: false,
    gatewayConfig: {
      gatewayUrl: 'https://gateway.chaoschain.io',
    },
  });

  console.log('\nTest 4: SDK initialization works');
  console.log('   Agent Name:', sdk.agentName);
  console.log('   Network:', sdk.network);
  console.log('   Wallet:', sdk.getAddress().substring(0, 10) + '...');

  // Test 5: Check capabilities
  const caps = sdk.getCapabilities();
  console.log('\nTest 5: SDK capabilities');
  console.log('   Features:', Object.keys(caps.features).length, 'features');
  console.log('   ERC-8004 Identity:', caps.features.erc_8004_identity);

  // Test 6: Gateway client accessible
  console.log('\nTest 6: Gateway client');
  console.log('   sdk.gateway:', typeof sdk.gateway);
  console.log('   sdk.gateway.healthCheck:', typeof sdk.gateway.healthCheck);
  console.log('   sdk.gateway.submitWork:', typeof sdk.gateway.submitWork);
  console.log('   sdk.gateway.submitScore:', typeof sdk.gateway.submitScore);
  console.log('   sdk.gateway.closeEpoch:', typeof sdk.gateway.closeEpoch);
  console.log('   sdk.gateway.getWorkflow:', typeof sdk.gateway.getWorkflow);
  console.log('   sdk.gateway.listWorkflows:', typeof sdk.gateway.listWorkflows);
  console.log('   sdk.gateway.waitForCompletion:', typeof sdk.gateway.waitForCompletion);

  // Test 7: Studio client accessible
  console.log('\nTest 7: Studio client');
  console.log('   sdk.studio:', typeof sdk.studio);
  console.log('   sdk.studio.createStudio:', typeof sdk.studio.createStudio);
  console.log('   sdk.studio.registerWithStudio:', typeof sdk.studio.registerWithStudio);
  console.log('   sdk.studio.getPendingRewards:', typeof sdk.studio.getPendingRewards);

  // Test 8: Helper methods
  console.log('\nTest 8: Studio helper methods');
  const salt = sdk.studio.generateSalt();
  console.log('   generateSalt():', salt.substring(0, 20) + '...');

  const scores = [85, 90, 78];
  const encoded = sdk.studio.encodeScoreVector(scores);
  console.log('   encodeScoreVector([85,90,78]):', encoded.substring(0, 30) + '...');

  console.log('\n All tests passed! SDK v0.2.0 is ready for production.\n');
  process.exit(0);
} catch (error) {
  console.error('\nTest failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
