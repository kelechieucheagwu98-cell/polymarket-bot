import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ReasoningContext {
  marketTitle: string;
  marketDescription: string;
  currentPrices: string[];
  outcomes: string[];
  aggressiveness: number;
  riskTolerance: 'low' | 'medium' | 'high';
  directive: string;
  model?: string;
}

export interface ReasoningResult {
  decision: 'BUY' | 'SELL' | 'HOLD';
  rationale: string;
  confidence: number;
  limit_price?: number;
  size_factor: number;
}

const FALLBACK: ReasoningResult = {
  decision: 'HOLD',
  rationale: 'Analysis failed or returned invalid data.',
  confidence: 0,
  size_factor: 0,
};

const validateResult = (parsed: any): ReasoningResult => {
  const valid = ['BUY', 'SELL', 'HOLD'] as const;
  const decision = valid.includes(parsed?.decision?.toUpperCase())
    ? (parsed.decision.toUpperCase() as ReasoningResult['decision'])
    : 'HOLD';
  return {
    decision,
    rationale: typeof parsed?.rationale === 'string' ? parsed.rationale : 'No rationale.',
    confidence: typeof parsed?.confidence === 'number' ? Math.max(0, Math.min(100, parsed.confidence)) : 0,
    limit_price: typeof parsed?.limit_price === 'number' && parsed.limit_price > 0 ? parsed.limit_price : undefined,
    size_factor: typeof parsed?.size_factor === 'number' ? Math.max(0, Math.min(1, parsed.size_factor)) : 0,
  };
};

export const analyzeMarket = async (
  apiKey: string,
  context: ReasoningContext
): Promise<ReasoningResult> => {
  if (!apiKey) return { ...FALLBACK, rationale: 'No Gemini API key provided.' };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: context.model ?? 'gemini-2.5-flash' });

  const prompt = `You are an autonomous prediction market trading agent operating on Polymarket.

AGENT DIRECTIVE (follow this above all else):
${context.directive || 'Find the highest-confidence edge and act on it. Prioritize liquidity and near-term resolution.'}

PARAMETERS:
- Aggressiveness: ${context.aggressiveness}/10 (higher = larger sizes, lower confidence threshold)
- Risk Tolerance: ${context.riskTolerance}

MARKET: "${context.marketTitle}"
DESCRIPTION: ${context.marketDescription}
OUTCOMES: ${context.outcomes.join(' vs ')}
CURRENT PRICES: ${context.outcomes.map((o, i) => `${o}: ${context.currentPrices[i]}`).join(', ')}

RULES:
- Prices are probabilities (0–1). Price 0.60 = 60% implied probability.
- BUY: you believe the first outcome's true probability exceeds its market price.
- SELL: you believe the first outcome is overpriced.
- HOLD: insufficient edge or conviction.

Return ONLY valid JSON, no markdown:
{
  "decision": "BUY" | "SELL" | "HOLD",
  "rationale": "2-3 sentences",
  "confidence": <0-100>,
  "limit_price": <0-1 or null>,
  "size_factor": <0.1-1.0>
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { ...FALLBACK, rationale: 'AI response had no JSON.' };
    return validateResult(JSON.parse(match[0]));
  } catch (error) {
    return { ...FALLBACK, rationale: `Analysis error: ${(error as Error).message}` };
  }
};
