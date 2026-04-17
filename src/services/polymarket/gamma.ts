/**
 * Polymarket Gamma API Client for Market Discovery
 * Documentation: https://gamma-api.polymarket.com
 * 
 * IMPORTANT: The Gamma API returns `outcomes`, `outcomePrices`, and `clobTokenIds`
 * as JSON-encoded strings, not native arrays. We parse them during fetch.
 */

// In dev, requests go through the Vite proxy (/gamma-api → gamma-api.polymarket.com)
// to avoid CORS. In production, replace with a real backend proxy or serverless function.
const GAMMA_API_URL = import.meta.env.DEV
  ? '/gamma-api'
  : 'https://gamma-api.polymarket.com';

export interface Market {
  id: string;
  question: string;
  description: string;
  outcomes: string[];
  outcomePrices: string[];
  clobTokenIds: string[];
  active: boolean;
  closed: boolean;
  volume: number;
  liquidity: number;
  endDate: string;
  negRisk: boolean;
  orderPriceMinTickSize: number;
  // Derived fields
  groupTitle: string;
}

/**
 * Safely parse a JSON-encoded string field from the Gamma API.
 * Returns an empty array if parsing fails.
 */
const safeParseArray = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Transform a raw Gamma API market object into our typed Market interface.
 */
const transformMarket = (raw: any): Market => ({
  id: raw.id ?? '',
  question: raw.question ?? '',
  description: raw.description ?? '',
  outcomes: safeParseArray(raw.outcomes),
  outcomePrices: safeParseArray(raw.outcomePrices),
  clobTokenIds: safeParseArray(raw.clobTokenIds),
  active: raw.active ?? false,
  closed: raw.closed ?? false,
  volume: raw.volumeNum ?? 0,
  liquidity: raw.liquidityNum ?? 0,
  endDate: raw.endDate ?? '',
  negRisk: raw.negRisk ?? false,
  orderPriceMinTickSize: raw.orderPriceMinTickSize ?? 0.01,
  groupTitle: raw.groupItemTitle ?? raw.question ?? '',
});

export const fetchMarkets = async (params: {
  active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Market[]> => {
  const query = new URLSearchParams({
    active: params.active !== undefined ? String(params.active) : 'true',
    limit: String(params.limit || 20),
    offset: String(params.offset || 0),
  });

  try {
    const response = await fetch(`${GAMMA_API_URL}/markets?${query.toString()}`);
    if (!response.ok) throw new Error(`Gamma API ${response.status}: ${response.statusText}`);
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn('Gamma API returned non-array response:', data);
      return [];
    }

    return data.map(transformMarket);
  } catch (error) {
    console.error('Gamma API Error:', error);
    return [];
  }
};

/**
 * Search markets by keyword. Uses the Gamma API filter endpoint.
 */
export const searchMarkets = async (keyword: string, limit = 20): Promise<Market[]> => {
  try {
    const query = new URLSearchParams({
      active: 'true',
      closed: 'false',
      limit: String(limit),
    });
    const response = await fetch(`${GAMMA_API_URL}/markets?${query.toString()}`);
    if (!response.ok) throw new Error(`Gamma API ${response.status}`);
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    // Client-side filtering since the Gamma API doesn't have a text search param
    return data
      .filter((m: any) =>
        m.question?.toLowerCase().includes(keyword.toLowerCase()) ||
        m.description?.toLowerCase().includes(keyword.toLowerCase())
      )
      .map(transformMarket);
  } catch (error) {
    console.error('Gamma Search Error:', error);
    return [];
  }
};
