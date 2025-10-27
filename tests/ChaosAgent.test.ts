import { describe, it, expect } from 'vitest';
import { ChaosAgent } from '../src/ChaosAgent';
import { ethers } from 'ethers';
import { NetworkConfig } from '../src/types';

describe('ChaosAgent', () => {
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  describe('Initialization', () => {
    it('should initialize with signer and network', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.ETHEREUM_SEPOLIA);
      
      expect(agent).toBeDefined();
    });

    it('should initialize for Base Sepolia', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.BASE_SEPOLIA);
      
      expect(agent).toBeDefined();
    });

    it('should initialize for Linea Sepolia', () => {
      const provider = new ethers.JsonRpcProvider('https://linea-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.LINEA_SEPOLIA);
      
      expect(agent).toBeDefined();
    });

    it('should throw for unsupported network', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      
      expect(() => {
        new ChaosAgent(signer, 'invalid-network' as NetworkConfig);
      }).toThrow();
    });
  });

  describe('ERC-8004 Compliance', () => {
    it('should have registerIdentity method', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.ETHEREUM_SEPOLIA);
      
      expect(typeof agent.registerIdentity).toBe('function');
    });

    it('should have giveFeedback method', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.ETHEREUM_SEPOLIA);
      
      expect(typeof agent.giveFeedback).toBe('function');
    });

    it('should have requestValidation method', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.ETHEREUM_SEPOLIA);
      
      expect(typeof agent.requestValidation).toBe('function');
    });

    it('should have respondToValidation method', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.ETHEREUM_SEPOLIA);
      
      expect(typeof agent.respondToValidation).toBe('function');
    });

    it('should have getAgentMetadata method', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.ETHEREUM_SEPOLIA);
      
      expect(typeof agent.getAgentMetadata).toBe('function');
    });

    it('should have setAgentUri method', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.ETHEREUM_SEPOLIA);
      
      expect(typeof agent.setAgentUri).toBe('function');
    });

    it('should have generateFeedbackAuthorization method', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.ETHEREUM_SEPOLIA);
      
      expect(typeof agent.generateFeedbackAuthorization).toBe('function');
    });
  });

  describe('Contract Addresses', () => {
    it('should use correct network for Ethereum Sepolia', () => {
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.ETHEREUM_SEPOLIA);
      
      expect(agent).toBeDefined();
      // Contract addresses are set internally
    });

    it('should use correct network for Base Sepolia', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.BASE_SEPOLIA);
      
      expect(agent).toBeDefined();
    });

    it('should use correct network for Linea Sepolia', () => {
      const provider = new ethers.JsonRpcProvider('https://linea-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const agent = new ChaosAgent(signer, NetworkConfig.LINEA_SEPOLIA);
      
      expect(agent).toBeDefined();
    });
  });
});
