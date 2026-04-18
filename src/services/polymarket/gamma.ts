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
  groupTitle: string;
}

const safeParseArray = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

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

const fetchAndTransform = async (params: Record<string, string>): Promise<Market[]> => {
  const query = new URLSearchParams(params);
  const response = await fetch(`${GAMMA_API_URL}/markets?${query}`);
  if (!response.ok) throw new Error(`Gamma API ${response.status}: ${response.statusText}`);
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map(transformMarket);
};

export const fetchMarkets = async (params: {
  active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Market[]> => {
  try {
    return await fetchAndTransform({
      active: String(params.active ?? true),
      limit: String(params.limit ?? 20),
      offset: String(params.offset ?? 0),
    });
  } catch (error) {
    console.error('Gamma API Error:', error);
    return [];
  }
};
