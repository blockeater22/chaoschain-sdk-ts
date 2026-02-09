/**
 * Network configurations for supported chains
 */

import { NetworkConfig, NetworkInfo, ContractAddresses } from '../types';

/**
 * ERC-8004 v1.0 contract addresses (pre-deployed)
 */
export const ERC8004_ADDRESSES: Record<string, ContractAddresses> = {
  'ethereum-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  // Official ERC-8004 Registries (Feb 2026 spec)
  'ethereum-sepolia': {
    identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    validation: '0x8004CB39f29c09145F24Ad9dDe2A108C1A2cdfC5',
  },
  'base-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'polygon-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'polygon-amoy': {
    identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'arbitrum-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'arbitrum-testnet': {
    identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'celo-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'celo-testnet': {
    identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'gnosis-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'scroll-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'scroll-testnet': {
    identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'taiko-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'monad-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'monad-testnet': {
    identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'optimism-sepolia': {
    identity: '0x0000000000000000000000000000000000000000',
    reputation: '0x0000000000000000000000000000000000000000',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'base-sepolia': {
    identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'mode-testnet': {
    identity: '0x0000000000000000000000000000000000000000',
    reputation: '0x0000000000000000000000000000000000000000',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'linea-sepolia': {
    identity: '0x8004aa7C931bCE1233973a0C6A667f73F66282e7',
    reputation: '0x8004bd8483b99310df121c46ED8858616b2Bba02',
    validation: '0x8004c44d1EFdd699B2A26e781eF7F77c56A9a4EB',
  },
  'hedera-testnet': {
    identity: '0x4c74ebd72921d537159ed2053f46c12a7d8e5923',
    reputation: '0xc565edcba77e3abeade40bfd6cf6bf583b3293e0',
    validation: '0x18df085d85c586e9241e0cd121ca422f571c2da6',
  },
  '0g-testnet': {
    identity: '0x80043ed9cf33a3472768dcd53175bb44e03a1e4a',
    reputation: '0x80045d7b72c47bf5ff73737b780cb1a5ba8ee202',
    validation: '0x80041728e0aadf1d1427f9be18d52b7f3afefafb',
  },
  'bsc-mainnet': {
    identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    validation: '0x0000000000000000000000000000000000000000',
  },
  'bsc-testnet': {
    identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    validation: '0x0000000000000000000000000000000000000000',
  },
};

/**
 * Network information and RPC endpoints
 */
export const NETWORK_INFO: Record<string, NetworkInfo> = {
  'ethereum-mainnet': {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETH_MAINNET_RPC_URL || 'https://ethereum-rpc.publicnode.com',
    contracts: ERC8004_ADDRESSES['ethereum-mainnet'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'ethereum-sepolia': {
    chainId: 11155111,
    name: 'Ethereum Sepolia Testnet',
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    contracts: ERC8004_ADDRESSES['ethereum-sepolia'],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'base-mainnet': {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org',
    contracts: ERC8004_ADDRESSES['base-mainnet'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'polygon-mainnet': {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: process.env.POLYGON_MAINNET_RPC_URL || 'https://polygon-rpc.com',
    contracts: ERC8004_ADDRESSES['polygon-mainnet'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  'polygon-amoy': {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    contracts: ERC8004_ADDRESSES['polygon-amoy'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  'arbitrum-mainnet': {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: process.env.ARBITRUM_MAINNET_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    contracts: ERC8004_ADDRESSES['arbitrum-mainnet'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'arbitrum-testnet': {
    chainId: 421614,
    name: 'Arbitrum Sepolia Testnet',
    rpcUrl: process.env.ARBITRUM_TESTNET_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    contracts: ERC8004_ADDRESSES['arbitrum-testnet'],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'celo-mainnet': {
    chainId: 42220,
    name: 'Celo Mainnet',
    rpcUrl: process.env.CELO_MAINNET_RPC_URL || 'https://forno.celo.org',
    contracts: ERC8004_ADDRESSES['celo-mainnet'],
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
  },
  'celo-testnet': {
    chainId: 44787,
    name: 'Celo Alfajores Testnet',
    rpcUrl: process.env.CELO_TESTNET_RPC_URL || 'https://alfajores-forno.celo.org',
    contracts: ERC8004_ADDRESSES['celo-testnet'],
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
  },
  'gnosis-mainnet': {
    chainId: 100,
    name: 'Gnosis Chain',
    rpcUrl: process.env.GNOSIS_MAINNET_RPC_URL || 'https://rpc.gnosischain.com',
    contracts: ERC8004_ADDRESSES['gnosis-mainnet'],
    nativeCurrency: {
      name: 'xDAI',
      symbol: 'xDAI',
      decimals: 18,
    },
  },
  'scroll-mainnet': {
    chainId: 534352,
    name: 'Scroll Mainnet',
    rpcUrl: process.env.SCROLL_MAINNET_RPC_URL || 'https://rpc.scroll.io',
    contracts: ERC8004_ADDRESSES['scroll-mainnet'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'scroll-testnet': {
    chainId: 534351,
    name: 'Scroll Sepolia Testnet',
    rpcUrl: process.env.SCROLL_TESTNET_RPC_URL || 'https://sepolia-rpc.scroll.io',
    contracts: ERC8004_ADDRESSES['scroll-testnet'],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'taiko-mainnet': {
    chainId: 167000,
    name: 'Taiko Mainnet',
    rpcUrl: process.env.TAIKO_MAINNET_RPC_URL || 'https://rpc.mainnet.taiko.xyz',
    contracts: ERC8004_ADDRESSES['taiko-mainnet'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'monad-mainnet': {
    chainId: Number(process.env.MONAD_MAINNET_CHAIN_ID),
    name: 'Monad Mainnet',
    rpcUrl: process.env.MONAD_MAINNET_RPC_URL || '',
    contracts: ERC8004_ADDRESSES['monad-mainnet'],
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18,
    },
  },
  'monad-testnet': {
    chainId: Number(process.env.MONAD_TESTNET_CHAIN_ID),
    name: 'Monad Testnet',
    rpcUrl: process.env.MONAD_TESTNET_RPC_URL || '',
    contracts: ERC8004_ADDRESSES['monad-testnet'],
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18,
    },
  },
  'optimism-sepolia': {
    chainId: 11155420,
    name: 'Optimism Sepolia Testnet',
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io',
    contracts: ERC8004_ADDRESSES['optimism-sepolia'],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'base-sepolia': {
    chainId: 84532,
    name: 'Base Sepolia Testnet',
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    contracts: ERC8004_ADDRESSES['base-sepolia'],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'mode-testnet': {
    chainId: 919,
    name: 'Mode Sepolia Testnet',
    rpcUrl: process.env.MODE_TESTNET_RPC_URL || 'https://sepolia.mode.network',
    contracts: ERC8004_ADDRESSES['mode-testnet'],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'linea-sepolia': {
    chainId: 59141,
    name: 'Linea Sepolia Testnet',
    rpcUrl: process.env.LINEA_SEPOLIA_RPC_URL || 'https://rpc.sepolia.linea.build',
    contracts: ERC8004_ADDRESSES['linea-sepolia'],
    nativeCurrency: {
      name: 'Linea ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  'hedera-testnet': {
    chainId: 296,
    name: 'Hedera Testnet',
    rpcUrl: process.env.HEDERA_TESTNET_RPC_URL || 'https://testnet.hashio.io/api',
    contracts: ERC8004_ADDRESSES['hedera-testnet'],
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
  },
  '0g-testnet': {
    chainId: 16602, // Updated to match Python SDK (was 16600)
    name: '0G Network Testnet',
    rpcUrl: process.env.ZEROG_TESTNET_RPC_URL || 'https://evmrpc-testnet.0g.ai',
    contracts: ERC8004_ADDRESSES['0g-testnet'],
    nativeCurrency: {
      name: 'A0GI',
      symbol: 'A0GI',
      decimals: 18,
    },
  },
  'bsc-testnet': {
    chainId: 97,
    name: 'BSC Testnet (Chapel)',
    rpcUrl: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    contracts: ERC8004_ADDRESSES['bsc-testnet'],
    nativeCurrency: {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
    },
  },
  'bsc-mainnet': {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrl: process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org',
    contracts: ERC8004_ADDRESSES['bsc-mainnet'],
    nativeCurrency: {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
    },
  },
  local: {
    chainId: 31337,
    name: 'Local Network',
    rpcUrl: process.env.LOCAL_RPC_URL || 'http://localhost:8545',
    contracts: {
      identity: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      reputation: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      validation: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    },
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

/**
 * Get network info by name
 */
export function getNetworkInfo(network: NetworkConfig | string): NetworkInfo {
  const networkKey = network as string;
  const info = NETWORK_INFO[networkKey];

  if (!info) {
    throw new Error(`Unsupported network: ${networkKey}`);
  }

  return info;
}

/**
 * Get contract addresses for a network
 */
export function getContractAddresses(network: NetworkConfig | string): ContractAddresses {
  return getNetworkInfo(network).contracts;
}

/**
 * Check if network is supported
 */
export function isNetworkSupported(network: string): boolean {
  return network in NETWORK_INFO;
}

/**
 * Get all supported networks
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(NETWORK_INFO);
}
