import { describe, it, expect } from 'vitest';
import { X402PaymentManager } from '../src/X402PaymentManager';
import { ethers } from 'ethers';

describe('X402PaymentManager', () => {
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const testRecipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  describe('Initialization', () => {
    it('should initialize with signer', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      expect(paymentManager).toBeDefined();
    });
  });

  describe('Payment Request Creation', () => {
    it('should create payment request with ETH', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const request = paymentManager.createPaymentRequest({
        amount: '1.0',
        currency: 'ETH',
        recipient: testRecipient,
        description: 'Test payment',
      });

      expect(request).toBeDefined();
      expect(request.amount).toBe('1.0');
      expect(request.currency).toBe('ETH');
      expect(request.recipient).toBe(testRecipient);
      expect(request.description).toBe('Test payment');
    });

    it('should create payment request with USDC', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const request = paymentManager.createPaymentRequest({
        amount: '100.0',
        currency: 'USDC',
        recipient: testRecipient,
        description: 'USDC payment',
      });

      expect(request).toBeDefined();
      expect(request.amount).toBe('100.0');
      expect(request.currency).toBe('USDC');
    });

    it('should include protocol fee in request', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const request = paymentManager.createPaymentRequest({
        amount: '100.0',
        currency: 'USDC',
        recipient: testRecipient,
        description: 'Test',
      });

      expect(request.protocolFee).toBeDefined();
      expect(typeof request.protocolFee).toBe('string');
    });

    it('should calculate 2.5% protocol fee correctly', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const amount = '100.0';
      const request = paymentManager.createPaymentRequest({
        amount,
        currency: 'USDC',
        recipient: testRecipient,
        description: 'Test',
      });

      const expectedFee = '2.5'; // 2.5% of 100
      expect(request.protocolFee).toBe(expectedFee);
    });

    it('should validate recipient address', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      expect(() => {
        paymentManager.createPaymentRequest({
          amount: '1.0',
          currency: 'ETH',
          recipient: 'invalid-address',
          description: 'Test',
        });
      }).toThrow();
    });

    it('should validate amount is positive', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      expect(() => {
        paymentManager.createPaymentRequest({
          amount: '-1.0',
          currency: 'ETH',
          recipient: testRecipient,
          description: 'Test',
        });
      }).toThrow();
    });

    it('should validate amount is numeric', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      expect(() => {
        paymentManager.createPaymentRequest({
          amount: 'invalid',
          currency: 'ETH',
          recipient: testRecipient,
          description: 'Test',
        });
      }).toThrow();
    });
  });

  describe('Protocol Fee Calculation', () => {
    it('should calculate fee correctly for various amounts', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const testCases = [
        { amount: '100', expectedFee: '2.5' },
        { amount: '1000', expectedFee: '25' },
        { amount: '0.1', expectedFee: '0.0025' },
        { amount: '1', expectedFee: '0.025' },
      ];

      testCases.forEach(({ amount, expectedFee }) => {
        const request = paymentManager.createPaymentRequest({
          amount,
          currency: 'USDC',
          recipient: testRecipient,
          description: 'Test',
        });

        expect(request.protocolFee).toBe(expectedFee);
      });
    });

    it('should handle very small amounts', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const request = paymentManager.createPaymentRequest({
        amount: '0.01',
        currency: 'ETH',
        recipient: testRecipient,
        description: 'Small payment',
      });

      expect(request.protocolFee).toBeDefined();
      expect(parseFloat(request.protocolFee)).toBeGreaterThan(0);
    });

    it('should handle very large amounts', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const request = paymentManager.createPaymentRequest({
        amount: '1000000',
        currency: 'USDC',
        recipient: testRecipient,
        description: 'Large payment',
      });

      expect(request.protocolFee).toBeDefined();
      const fee = parseFloat(request.protocolFee);
      expect(fee).toBe(25000); // 2.5% of 1,000,000
    });
  });

  describe('Multi-Currency Support', () => {
    it('should support ETH', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const request = paymentManager.createPaymentRequest({
        amount: '1.0',
        currency: 'ETH',
        recipient: testRecipient,
        description: 'ETH payment',
      });

      expect(request.currency).toBe('ETH');
    });

    it('should support USDC', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const request = paymentManager.createPaymentRequest({
        amount: '100.0',
        currency: 'USDC',
        recipient: testRecipient,
        description: 'USDC payment',
      });

      expect(request.currency).toBe('USDC');
    });

    it('should reject unsupported currency', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      expect(() => {
        paymentManager.createPaymentRequest({
          amount: '1.0',
          currency: 'BTC',
          recipient: testRecipient,
          description: 'BTC payment',
        });
      }).toThrow();
    });
  });

  describe('Payment History', () => {
    it('should have getPaymentHistory method', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      expect(typeof paymentManager.getPaymentHistory).toBe('function');
    });

    it('should return array from getPaymentHistory', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const history = paymentManager.getPaymentHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount gracefully', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      expect(() => {
        paymentManager.createPaymentRequest({
          amount: '0',
          currency: 'ETH',
          recipient: testRecipient,
          description: 'Zero payment',
        });
      }).toThrow();
    });

    it('should handle empty description', () => {
      const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/demo');
      const signer = new ethers.Wallet(testPrivateKey, provider);
      const paymentManager = new X402PaymentManager(signer);
      
      const request = paymentManager.createPaymentRequest({
        amount: '1.0',
        currency: 'ETH',
        recipient: testRecipient,
        description: '',
      });

      expect(request).toBeDefined();
      expect(request.description).toBe('');
    });
  });
});
