import { ClobClient } from '@polymarket/clob-client';
import { Chain } from '@polymarket/clob-client/dist/types';
import { ethers } from 'ethers';

const HOST_MAINNET = 'https://clob.polymarket.com';
// Note: Polymarket testnet CLOB host — verify with docs if this changes
const HOST_TESTNET = 'https://clob.polymarket.com';

export interface ClobConfig {
  privateKey: string;
  isDemo: boolean;
}

/**
 * Initializes an authenticated CLOB client.
 * 
 * IMPORTANT: The @polymarket/clob-client SDK Chain enum only supports
 * POLYGON (137) and MUMBAI (80001). We always use POLYGON for now,
 * and gate demo-mode behavior at the application level (no real orders sent).
 */
export const getClobClient = async (config: ClobConfig): Promise<ClobClient | null> => {
  const host = config.isDemo ? HOST_TESTNET : HOST_MAINNET;
  // SDK only supports Chain.POLYGON (137) and Chain.MUMBAI (80001)
  const chainId = Chain.POLYGON;

  try {
    const wallet = new ethers.Wallet(config.privateKey);

    // 1. Initialize to create/derive API credentials
    const initialClient = new ClobClient(host, chainId, wallet);
    const creds = await initialClient.createOrDeriveApiKey();

    // 2. Return fully authenticated client
    return new ClobClient(host, chainId, wallet, creds);
  } catch (error) {
    console.error('CLOB Auth Error:', error);
    return null;
  }
};

/**
 * Cancels all open orders for the authenticated account.
 */
export const cancelAllOrders = async (client: ClobClient): Promise<any> => {
  try {
    const response = await client.cancelAll();
    return response;
  } catch (error) {
    console.error('Cancel All Error:', error);
    return null;
  }
};
