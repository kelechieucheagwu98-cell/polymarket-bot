# Polymarket AI Trading Agent

An autonomous prediction market trading agent for [Polymarket](https://polymarket.com) powered by Google Gemini. The agent discovers markets, analyzes them using a configurable AI directive, and executes trades — all gasless via Polymarket's order relayer.

---

## Features

### Autonomous Trading
- Fetches live markets from the Gamma API, sorted by volume
- Auto-rotates through all active markets each cycle, or targets a single market manually
- Executes BUY/SELL orders via the Polymarket CLOB — no gas fees (signed off-chain, relayed by Polymarket)
- Stops automatically when the cumulative spend limit is reached

### AI Reasoning
- Powered by Google Gemini (model selectable at runtime)
- Free-text **Agent Directive** — write any instruction: focus area, confidence thresholds, strategy, risk posture
- Full reasoning trace visible in the live feed for every decision

### Balance & Portfolio Tracking
- Live USDC balance fetched from Polygon (USDC.e) for live accounts
- Demo mode with configurable starting balance (default $1,000)
- Session P&L shown in real time
- Transaction history with **Expected Return**, **Max Loss**, and **EV** per trade
- Aggregate EV across the session

### Risk Controls
- **Max Trade Budget** — caps total cumulative spend; agent stops when the limit is hit
- **Aggressiveness** slider — controls trade size and confidence threshold
- **Risk Tolerance** — Low / Medium / High filters
- **Panic button** — stops agent and cancels all open CLOB orders instantly
- **Reset Experiment** — restores demo balance, clears trade history and reasoning log

### Demo Mode
- All decisions logged but no real orders placed
- Configurable starting balance for backtesting strategies
- Full EV/expectancy tracking identical to live mode

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js v18+ | v20+ recommended |
| Google Gemini API key | [Google AI Studio](https://aistudio.google.com/) — free tier works for Gemini 2.5 Flash |
| Polygon private key | Burner wallet strongly recommended for live trading |

---

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and complete the one-time setup wizard. Credentials are saved to `localStorage` so you won't need to re-enter them on refresh.

---

## AI Models

Select the model in the Tuning panel at runtime. No restart needed.

| Model ID | Notes |
|---|---|
| `gemini-3.1-pro-preview` | Most capable; paid tier only |
| `gemini-3-flash-preview` | Fast with strong reasoning |
| `gemini-3.1-flash-lite-preview` | Budget preview option |
| `gemini-2.5-pro` | Stable, highly capable |
| `gemini-2.5-flash` | **Default** — best speed/quality balance |
| `gemini-2.5-flash-lite` | Cheapest stable option |

> Preview models (`-preview`) may be deprecated without notice. Check [Google AI model docs](https://ai.google.dev/gemini-api/docs/models) for the current list.

---

## Project Structure

```
src/
├── services/
│   ├── polymarket/
│   │   ├── gamma.ts       # Market discovery (Gamma API)
│   │   ├── clob.ts        # Order execution (CLOB API, cached auth)
│   │   └── portfolio.ts   # Balance, transactions, EV calculations
│   └── ai/
│       └── reasoning.ts   # Gemini prompt + response validation
├── components/
│   ├── dashboard/
│   │   ├── MarketCard.tsx
│   │   ├── BrainFeed.tsx
│   │   ├── BalanceWidget.tsx
│   │   ├── TuningPanel.tsx
│   │   └── TransactionHistory.tsx
│   └── onboarding/
│       └── OnboardingWizard.tsx
└── App.tsx
```

---

## How EV Is Calculated

For each trade the agent takes:

- **Expected Return** — profit if the trade resolves correctly (`size × (1 − price)` for BUY)
- **Max Loss** — cost if wrong (`size × price` for BUY)
- **EV** — `(confidence% × expectedReturn) − ((1 − confidence%) × maxLoss)`

A positive EV means the AI believes the bet is mathematically sound given its confidence estimate.

---

## Disclaimer

Prediction markets carry significant financial risk. This tool is for research and automation purposes only — not financial advice. Always start in Demo mode. Use a dedicated burner wallet with limited funds for live trading.
