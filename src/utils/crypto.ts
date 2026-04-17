import { ethers } from 'ethers';

/**
 * Initializes a wallet from a private key.
 * Used for session-based trading.
 */
export const getWallet = (privateKey: string) => {
  try {
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    return new ethers.Wallet(privateKey);
  } catch (error) {
    console.error('Failed to initialize wallet:', error);
    return null;
  }
};

/**
 * Basic utility to check if a string is a valid private key.
 */
export const isValidPrivateKey = (key: string): boolean => {
  try {
    const formatted = key.startsWith('0x') ? key : '0x' + key;
    return ethers.utils.isHexString(formatted, 32);
  } catch {
    return false;
  }
};
