// No SDK imports needed; native fetch handles all API providers.

export interface ReasoningContext {
  marketTitle: string;
  marketDescription: string;
  currentPrices: string[];
  outcomes: string[];
  aggressiveness: number;
  riskTolerance: 'low' | 'medium' | 'high';
  directive: string;
  model?: string;
  claudeKey?: string;
  xaiKey?: string;
  openAiKey?: string;
  openRouterKey?: string;
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

const buildPrompt = (context: ReasoningContext) => `You are an autonomous prediction market trading agent operating on Polymarket.

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

const extractJSON = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI response had no JSON.');
  return JSON.parse(match[0]);
};

// --- Provider Fetchers ---

const fetchGemini = async (apiKey: string, context: ReasoningContext, prompt: string) => {
  if (!apiKey) throw new Error('No Gemini API key provided.');
  const modelId = context.model ?? 'gemini-3.1-pro-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google API error: ${response.status} - ${errText}`);
  }
  
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

const fetchAnthropic = async (apiKey: string, context: ReasoningContext, prompt: string) => {
  if (!apiKey) throw new Error('No Anthropic API key provided.');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true' // Required for web apps
    },
    body: JSON.stringify({
      model: context.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`);
  const data = await response.json();
  return data.content[0].text;
};

const fetchOpenAIFormat = async (endpoint: string, apiKey: string, context: ReasoningContext, prompt: string) => {
  if (!apiKey) throw new Error(`No API key provided for ${endpoint}.`);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: context.model,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) throw new Error(`API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices[0].message.content;
};

// --- Main Router ---

export const analyzeMarket = async (
  apiKey: string, // Kept for backwards compatibility, used as geminiKey
  context: ReasoningContext
): Promise<ReasoningResult> => {
  const prompt = buildPrompt(context);
  const modelId = context.model || 'gemini-3.1-pro-preview';

  try {
    let responseText = '';

    if (modelId.startsWith('gemini')) {
      responseText = await fetchGemini(apiKey, context, prompt);
    } else if (modelId.startsWith('claude')) {
      responseText = await fetchAnthropic(context.claudeKey || '', context, prompt);
    } else if (modelId.startsWith('grok')) {
      responseText = await fetchOpenAIFormat('https://api.x.ai/v1/chat/completions', context.xaiKey || '', context, prompt);
    } else if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) {
      responseText = await fetchOpenAIFormat('https://api.openai.com/v1/chat/completions', context.openAiKey || '', context, prompt);
    } else if (modelId.includes('/')) {
      // OpenRouter format: provider/model
      responseText = await fetchOpenAIFormat('https://openrouter.ai/api/v1/chat/completions', context.openRouterKey || '', context, prompt);
    } else {
      throw new Error(`Unsupported model identifier: ${modelId}`);
    }

    return validateResult(extractJSON(responseText));
  } catch (error) {
    return { ...FALLBACK, rationale: `Analysis error: ${(error as Error).message}` };
  }
};
