import { useState, useEffect, useRef } from 'react';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { TuningPanel } from './components/dashboard/TuningPanel';
import { BrainFeed, LogEntry } from './components/dashboard/BrainFeed';
import { MarketCard } from './components/dashboard/MarketCard';
import { fetchMarkets, Market } from './services/polymarket/gamma';
import { analyzeMarket } from './services/ai/reasoning';
import { getClobClient, cancelAllOrders } from './services/polymarket/clob';
import { Side, OrderType } from '@polymarket/clob-client';
import type { TickSize } from '@polymarket/clob-client';

interface Credentials {
  geminiKey: string;
  privateKey: string;
}

interface TuningParams {
  aggressiveness: number;
  riskTolerance: 'low' | 'medium' | 'high';
  interval: number;
}

const STRATEGIES = [
  'Sentiment Arbitrage',
  'Momentum Trading',
  'Contrarian',
  'Value Hunting',
] as const;

function App() {
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [tuning, setTuning] = useState<TuningParams>({
    aggressiveness: 5,
    riskTolerance: 'medium',
    interval: 30,
  });
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [strategy, setStrategy] = useState<string>(STRATEGIES[0]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Ref to track the latest values inside the interval callback
  const liveRef = useRef({ isLive, creds, selectedMarket, tuning, isDemo, strategy });
  useEffect(() => {
    liveRef.current = { isLive, creds, selectedMarket, tuning, isDemo, strategy };
  });

  // Market Discovery
  useEffect(() => {
    const loadMarkets = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMarkets({ active: true, limit: 30 });
        setMarkets(data);
      } catch (err) {
        console.error('Failed to load markets', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMarkets();
    const timer = setInterval(loadMarkets, 60000);
    return () => clearInterval(timer);
  }, []);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev.slice(-200), {  // Cap at 200 entries to prevent memory leak
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    }]);
  };

  // Main Decision Loop
  useEffect(() => {
    if (!isLive || !creds || !selectedMarket) return;

    const runTurn = async () => {
      const { creds: c, selectedMarket: m, tuning: t, isDemo: demo, strategy: strat } = liveRef.current;
      if (!c || !m) return;

      addLog('info', `Analyzing "${m.question}"...`);

      const result = await analyzeMarket(c.geminiKey, {
        marketTitle: m.question,
        marketDescription: m.description,
        currentPrices: m.outcomePrices,
        outcomes: m.outcomes,
        aggressiveness: t.aggressiveness,
        riskTolerance: t.riskTolerance,
        strategy: strat,
      });

      addLog('brain', `[${result.decision}] ${result.rationale} (Confidence: ${result.confidence}%)`);

      if (result.decision === 'HOLD') {
        addLog('info', 'Decision: HOLD — no trade placed.');
        return;
      }

      // Demo mode: log the trade but don't execute
      if (demo) {
        addLog('trade', `[DEMO] Would ${result.decision} on "${m.question}" @ ${result.limit_price ?? 'market'} (size_factor: ${result.size_factor})`);
        return;
      }

      // Live mode: execute the trade
      addLog('trade', `[LIVE] Executing ${result.decision} on "${m.question}"...`);
      try {
        const client = await getClobClient({ privateKey: c.privateKey, isDemo: demo });
        if (!client) throw new Error('Failed to initialize CLOB client');

        const tradeSize = 10 * result.size_factor;
        const outcomeIndex = result.decision === 'BUY' ? 0 : 1;
        const tickSize = String(m.orderPriceMinTickSize || 0.01) as TickSize;

        const orderParams = {
          tokenID: m.clobTokenIds[outcomeIndex],
          price: result.limit_price ?? parseFloat(m.outcomePrices[outcomeIndex]),
          side: result.decision === 'BUY' ? Side.BUY : Side.SELL,
          size: tradeSize,
        };

        const signedOrder = await client.createOrder(orderParams, tickSize);
        const orderResponse = await client.postOrder(signedOrder, OrderType.GTC);

        addLog('trade', `✓ Order placed: ${JSON.stringify(orderResponse).substring(0, 100)}`);
      } catch (error: any) {
        addLog('error', `Trade failed: ${error.message}`);
      }
    };

    // Run immediately, then on interval
    runTurn();
    const timer = setInterval(runTurn, tuning.interval * 1000);
    return () => clearInterval(timer);
  }, [isLive, creds, selectedMarket, tuning.interval]);

  if (!creds) {
    return <OnboardingWizard onComplete={setCreds} />;
  }

  return (
    <div className="app-container fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Polymarket AI Agent</h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              backgroundColor: isLive ? 'var(--success-color)' : 'var(--panic-color)',
              display: 'inline-block',
            }}></span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              {isLive ? 'ACTIVE SESSION' : 'PAUSED'} | {isDemo ? 'DEMO ACCOUNT' : 'LIVE ACCOUNT'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={strategy}
            onChange={e => setStrategy(e.target.value)}
            style={{ width: 'auto', marginBottom: 0 }}
          >
            {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => {
              if (!isDemo && isLive) {
                // Confirm switching from live to demo while running
                setIsLive(false);
                addLog('info', 'Agent stopped before switching to Demo.');
              }
              setIsDemo(!isDemo);
              addLog('info', `Switched to ${isDemo ? 'LIVE' : 'DEMO'} mode.`);
            }}
            style={{ background: isDemo ? 'var(--glass-bg)' : 'rgba(255, 51, 102, 0.2)', color: 'white' }}
          >
            {isDemo ? '🧪 Demo' : '🔴 Live'}
          </button>
          <button
            className={isLive ? 'panic' : 'primary'}
            onClick={() => {
              if (!isLive && !selectedMarket) {
                addLog('error', 'Select a market before starting the agent.');
                return;
              }
              setIsLive(!isLive);
              addLog('info', isLive ? 'Agent stopped.' : 'Agent started.');
            }}
          >
            {isLive ? 'STOP AGENT' : 'START AGENT'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        <main>
          <div className="glass" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Market Discovery</h3>
              {isLoading && <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Loading...</span>}
            </div>
            {markets.length === 0 && !isLoading && (
              <p style={{ opacity: 0.5, textAlign: 'center' }}>No markets found. Check your connection.</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {markets.map(m => (
                <MarketCard
                  key={m.id}
                  market={m}
                  isSelected={selectedMarket?.id === m.id}
                  onSelect={setSelectedMarket}
                />
              ))}
            </div>
          </div>
          <BrainFeed logs={logs} />
        </main>

        <aside>
          <TuningPanel params={tuning} onChange={setTuning} />
          <div className="glass" style={{ marginTop: '2rem' }}>
            <h3>Emergency Controls</h3>
            <button
              className="panic"
              style={{ width: '100%', marginBottom: '1rem' }}
              onClick={async () => {
                setIsLive(false);
                addLog('error', 'PANIC: Stopping agent and canceling all orders...');
                if (creds) {
                  try {
                    const client = await getClobClient({ privateKey: creds.privateKey, isDemo });
                    if (client) {
                      await cancelAllOrders(client);
                      addLog('info', 'All orders canceled successfully.');
                    }
                  } catch (err: any) {
                    addLog('error', `Cancel failed: ${err.message}`);
                  }
                }
              }}
            >
              ⛔ STOP & CANCEL ALL
            </button>
            <button
              className="panic"
              style={{ width: '100%', opacity: 0.7 }}
              onClick={() => addLog('error', 'Liquidation: This requires fetching positions via the Data API. Coming soon.')}
            >
              🚨 EXIT ALL POSITIONS
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
