import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ReasoningContext {
  marketTitle: string;
  marketDescription: string;
  currentPrices: string[];
  outcomes: string[];
  aggressiveness: number; // 1-10
  riskTolerance: 'low' | 'medium' | 'high';
  strategy: string;
}

export interface ReasoningResult {
  decision: 'BUY' | 'SELL' | 'HOLD';
  rationale: string;
  confidence: number;
  limit_price?: number;
  size_factor: number;
}

const FALLBACK_RESULT: ReasoningResult = {
  decision: 'HOLD',
  rationale: 'Analysis failed or returned invalid data. Holding position.',
  confidence: 0,
  size_factor: 0,
};

/**
 * Validates and sanitizes the parsed AI response into a safe ReasoningResult.
 */
const validateResult = (parsed: any): ReasoningResult => {
  const validDecisions = ['BUY', 'SELL', 'HOLD'] as const;
  const decision = validDecisions.includes(parsed?.decision?.toUpperCase())
    ? (parsed.decision.toUpperCase() as ReasoningResult['decision'])
    : 'HOLD';

  const confidence = typeof parsed?.confidence === 'number'
    ? Math.max(0, Math.min(100, parsed.confidence))
    : 0;

  const size_factor = typeof parsed?.size_factor === 'number'
    ? Math.max(0, Math.min(1, parsed.size_factor))
    : 0;

  const limit_price = typeof parsed?.limit_price === 'number' && parsed.limit_price > 0
    ? parsed.limit_price
    : undefined;

  return {
    decision,
    rationale: typeof parsed?.rationale === 'string' ? parsed.rationale : 'No rationale provided.',
    confidence,
    limit_price,
    size_factor,
  };
};

export const analyzeMarket = async (
  apiKey: string,
  context: ReasoningContext
): Promise<ReasoningResult> => {
  if (!apiKey) {
    return { ...FALLBACK_RESULT, rationale: 'No Gemini API key provided.' };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a professional prediction market trading agent for Polymarket.
Analyze the following market and decide the best action.

STRATEGY: ${context.strategy}
AGGRESSIVENESS: ${context.aggressiveness}/10
RISK TOLERANCE: ${context.riskTolerance}

MARKET: "${context.marketTitle}"
DESCRIPTION: ${context.marketDescription}
OUTCOMES: ${context.outcomes.join(' vs ')}
CURRENT PRICES: ${context.outcomes.map((o, i) => `${o}: ${context.currentPrices[i]}`).join(', ')}

RULES:
- Prices represent probability (0 to 1). A price of 0.60 means 60% implied probability.
- BUY means you believe the first outcome is underpriced (true probability > market price).
- SELL means you believe the first outcome is overpriced (true probability < market price).
- HOLD means the price accurately reflects reality or you lack conviction.
- Higher aggressiveness = accept lower confidence trades and larger sizes.
- Lower risk tolerance = only trade when you have very high confidence.

Return ONLY a JSON object (no markdown, no explanation outside JSON):
{
  "decision": "BUY" | "SELL" | "HOLD",
  "rationale": "2-3 sentence explanation of your reasoning",
  "confidence": <number 1-100>,
  "limit_price": <number between 0 and 1, or null>,
  "size_factor": <number 0.1 to 1.0>
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Gemini returned no JSON:', text.substring(0, 200));
      return { ...FALLBACK_RESULT, rationale: 'AI response did not contain valid JSON.' };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return validateResult(parsed);
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    return { ...FALLBACK_RESULT, rationale: `Analysis error: ${(error as Error).message}` };
  }
};
