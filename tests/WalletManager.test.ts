import { describe, it, expect, afterEach } from 'vitest';
import { WalletManager } from '../src/WalletManager';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

describe('WalletManager', () => {
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const testMnemonic = 'test test test test test test test test test test test junk';
  const testWalletPath = path.join(__dirname, 'test-wallet.json');

  afterEach(() => {
    // Clean up test wallet files
    if (fs.existsSync(testWalletPath)) {
      fs.unlinkSync(testWalletPath);
    }
  });

  describe('Initialization', () => {
    it('should create wallet from private key', () => {
      const walletManager = new WalletManager(testPrivateKey);
      expect(walletManager).toBeDefined();
      expect(walletManager.getAddress()).toBeDefined();
      expect(ethers.isAddress(walletManager.getAddress())).toBe(true);
    });

    it('should create wallet from mnemonic', () => {
      const walletManager = new WalletManager(undefined, testMnemonic);
      expect(walletManager).toBeDefined();
      expect(walletManager.getAddress()).toBeDefined();
      expect(ethers.isAddress(walletManager.getAddress())).toBe(true);
    });

    it('should generate new wallet if no key or mnemonic provided', () => {
      const walletManager = new WalletManager();
      expect(walletManager).toBeDefined();
      expect(walletManager.getAddress()).toBeDefined();
      expect(ethers.isAddress(walletManager.getAddress())).toBe(true);
    });

    it('should throw error for invalid private key', () => {
      expect(() => {
        new WalletManager('invalid-key');
      }).toThrow();
    });

    it('should prefer private key over mnemonic', () => {
      const walletManager = new WalletManager(testPrivateKey, testMnemonic);
      const address = walletManager.getAddress();
      
      // Verify it used the private key
      const expectedAddress = new ethers.Wallet(testPrivateKey).address;
      expect(address).toBe(expectedAddress);
    });
  });

  describe('Address Management', () => {
    it('should return valid Ethereum address', () => {
      const walletManager = new WalletManager(testPrivateKey);
      const address = walletManager.getAddress();
      expect(ethers.isAddress(address)).toBe(true);
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should return consistent address', () => {
      const walletManager = new WalletManager(testPrivateKey);
      const address1 = walletManager.getAddress();
      const address2 = walletManager.getAddress();
      expect(address1).toBe(address2);
    });

    it('should have checksummed address', () => {
      const walletManager = new WalletManager(testPrivateKey);
      const address = walletManager.getAddress();
      expect(address).toBe(ethers.getAddress(address));
    });
  });

  describe('Signing', () => {
    it('should sign message correctly', async () => {
      const walletManager = new WalletManager(testPrivateKey);
      const message = 'Test message';
      const signature = await walletManager.signMessage(message);
      
      expect(signature).toBeDefined();
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/); // 65 bytes = 130 hex chars
    });

    it('should sign transaction correctly', async () => {
      const walletManager = new WalletManager(testPrivateKey);
      const tx = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: ethers.parseEther('1.0'),
        gasLimit: 21000,
      };

      const signedTx = await walletManager.signTransaction(tx);
      expect(signedTx).toBeDefined();
      expect(signedTx).toMatch(/^0x/);
    });

    it('should recover signer from signature', async () => {
      const walletManager = new WalletManager(testPrivateKey);
      const message = 'Test message';
      const signature = await walletManager.signMessage(message);
      
      const recoveredAddress = ethers.verifyMessage(message, signature);
      expect(recoveredAddress).toBe(walletManager.getAddress());
    });
  });

  describe('Mnemonic Management', () => {
    it('should return mnemonic for HD wallet', () => {
      const walletManager = new WalletManager(undefined, testMnemonic);
      const mnemonic = walletManager.getMnemonic();
      
      expect(mnemonic).toBeDefined();
      expect(mnemonic).toBe(testMnemonic);
    });

    it('should return null mnemonic for non-HD wallet', () => {
      const walletManager = new WalletManager(testPrivateKey);
      const mnemonic = walletManager.getMnemonic();
      
      expect(mnemonic).toBeUndefined();
    });

    it('should generate valid mnemonic for new wallet', () => {
      const walletManager = new WalletManager();
      const mnemonic = walletManager.getMnemonic();
      
      expect(mnemonic).toBeDefined();
      if (mnemonic) {
        const words = mnemonic.split(' ');
        expect(words.length).toBe(12); // Standard 12-word mnemonic
      }
    });
  });

  describe('Private Key Management', () => {
    it('should return private key', () => {
      const walletManager = new WalletManager(testPrivateKey);
      const privateKey = walletManager.getPrivateKey();
      expect(privateKey).toBeDefined();
      expect(privateKey).toBe(testPrivateKey);
    });

    it('should have valid private key format', () => {
      const walletManager = new WalletManager(testPrivateKey);
      const privateKey = walletManager.getPrivateKey();
      expect(privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('Wallet Persistence', () => {
    it('should save wallet to file', async () => {
      const walletManager = new WalletManager(testPrivateKey);
      const password = 'test-password-123';
      
      await walletManager.saveWallet(testWalletPath, password);
      
      expect(fs.existsSync(testWalletPath)).toBe(true);
    });

    it('should load wallet from file', async () => {
      // First save a wallet
      const walletManager = new WalletManager(testPrivateKey);
      const password = 'test-password-123';
      await walletManager.saveWallet(testWalletPath, password);
      
      // Then load it
      const loadedManager = await WalletManager.loadWallet(testWalletPath, password);
      
      expect(loadedManager.getAddress()).toBe(walletManager.getAddress());
      expect(loadedManager.getPrivateKey()).toBe(testPrivateKey);
    });

    it('should fail to load wallet with wrong password', async () => {
      const walletManager = new WalletManager(testPrivateKey);
      const password = 'correct-password';
      await walletManager.saveWallet(testWalletPath, password);
      
      await expect(async () => {
        await WalletManager.loadWallet(testWalletPath, 'wrong-password');
      }).rejects.toThrow();
    });

    it('should encrypt wallet with password', async () => {
      const walletManager = new WalletManager(testPrivateKey);
      const password = 'strong-password-123';
      await walletManager.saveWallet(testWalletPath, password);
      
      const fileContent = fs.readFileSync(testWalletPath, 'utf-8');
      
      // Encrypted wallet should not contain plaintext private key
      expect(fileContent).not.toContain(testPrivateKey);
      expect(fileContent).toContain('"crypto"'); // Standard encrypted wallet format
    });
  });

  describe('Wallet Generation', () => {
    it('should generate unique wallets', () => {
      const wallet1 = new WalletManager();
      const wallet2 = new WalletManager();
      
      expect(wallet1.getAddress()).not.toBe(wallet2.getAddress());
      expect(wallet1.getPrivateKey()).not.toBe(wallet2.getPrivateKey());
    });

    it('should generate valid random private keys', () => {
      const wallet = new WalletManager();
      const privateKey = wallet.getPrivateKey();
      
      expect(privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(privateKey.length).toBe(66); // '0x' + 64 hex chars
    });
  });

  describe('Connect to Provider', () => {
    it('should connect to provider', () => {
      const walletManager = new WalletManager(testPrivateKey);
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      const connectedWallet = walletManager.connect(provider);
      
      expect(connectedWallet).toBeDefined();
      expect(connectedWallet.provider).toBe(provider);
    });

    it('should maintain address after connecting', () => {
      const walletManager = new WalletManager(testPrivateKey);
      const addressBefore = walletManager.getAddress();
      
      const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
      walletManager.connect(provider);
      
      const addressAfter = walletManager.getAddress();
      expect(addressBefore).toBe(addressAfter);
    });
  });
});
