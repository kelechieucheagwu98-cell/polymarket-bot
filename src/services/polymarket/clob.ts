import { ClobClient, Chain } from '@polymarket/clob-client';
import { ethers } from 'ethers';

const HOST = 'https://clob.polymarket.com';

export interface ClobConfig {
  privateKey: string;
  isDemo: boolean;
}

// Cache the authenticated client — createOrDeriveApiKey() is a network round-trip
// that would otherwise fire on every single trade cycle.
let _client: ClobClient | null = null;
let _clientKey: string | null = null;

export const getClobClient = async (config: ClobConfig): Promise<ClobClient | null> => {
  if (_client && _clientKey === config.privateKey) return _client;
  try {
    const wallet = new ethers.Wallet(config.privateKey);
    const seed = new ClobClient(HOST, Chain.POLYGON, wallet);
    const creds = await seed.createOrDeriveApiKey();
    _client = new ClobClient(HOST, Chain.POLYGON, wallet, creds);
    _clientKey = config.privateKey;
    return _client;
  } catch (error) {
    console.error('CLOB Auth Error:', error);
    return null;
  }
};

export const cancelAllOrders = (client: ClobClient) => client.cancelAll();
