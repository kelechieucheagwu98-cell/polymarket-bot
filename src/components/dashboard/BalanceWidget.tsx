import React from 'react';

interface BalanceWidgetProps {
  balance: number;
  startingBalance: number;
  isDemo: boolean;
  walletAddress: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const BalanceWidget: React.FC<BalanceWidgetProps> = ({
  balance, startingBalance, isDemo, walletAddress, isRefreshing, onRefresh
}) => {
  const short = walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : '';
  const pnl = startingBalance > 0 ? balance - startingBalance : 0;
  const pnlPositive = pnl >= 0;

  return (
    <div className="glass" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>
            Balance
            {isDemo && <span style={{ marginLeft: '0.5rem', color: 'var(--yellow)', fontSize: '0.6rem', background: 'rgba(246,173,85,0.12)', padding: '0.1rem 0.4rem', borderRadius: '3px', border: '1px solid rgba(246,173,85,0.2)' }}>DEMO</span>}
          </h3>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>USDC</span>
          </div>
          {pnl !== 0 && (
            <div style={{ fontSize: '0.78rem', marginTop: '0.2rem', fontWeight: 600, color: pnlPositive ? 'var(--green)' : 'var(--red)' }}>
              {pnlPositive ? '+' : ''}${pnl.toFixed(2)} this session
            </div>
          )}
          {short && !isDemo && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'monospace' }}>{short}</div>
          )}
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          {!isDemo && (
            <button onClick={onRefresh} disabled={isRefreshing} style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: '0.7rem', padding: '0.25rem 0.55rem',
              opacity: isRefreshing ? 0.4 : 1,
            }}>
              {isRefreshing ? '…' : '↺'}
            </button>
          )}
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.5 }}>⛽ gas-free</span>
        </div>
      </div>
    </div>
  );
};
