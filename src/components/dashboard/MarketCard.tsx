import React from 'react';
import { Market } from '../../services/polymarket/gamma';

interface MarketCardProps {
  market: Market;
  isSelected: boolean;
  isActive?: boolean;
  onSelect: (market: Market) => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market, isSelected, isActive = false, onSelect }) => {
  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const cardClass = [
    'market-card',
    isSelected ? 'market-card--selected' : '',
    isActive ? 'market-card--active' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass} onClick={() => onSelect(market)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', color: isActive ? 'var(--green)' : 'var(--accent)', textTransform: 'uppercase' }}>
          {isActive ? '⬤ scanning' : market.negRisk ? 'neg risk' : 'standard'}
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {formatVolume(market.volume)}
        </span>
      </div>
      <p style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
        {market.question}
      </p>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {market.outcomes.map((outcome, i) => {
          const price = parseFloat(market.outcomePrices[i] || '0');
          const isYes = outcome.toLowerCase() === 'yes';
          return (
            <span key={i} style={{
              fontSize: '0.7rem', fontWeight: 600,
              padding: '0.15rem 0.55rem', borderRadius: '4px',
              background: isYes ? 'var(--green-dim)' : 'rgba(255,255,255,0.05)',
              color: isYes ? 'var(--green)' : 'var(--text-muted)',
              border: `1px solid ${isYes ? 'rgba(104,211,145,0.15)' : 'transparent'}`,
            }}>
              {outcome} {(price * 100).toFixed(0)}%
            </span>
          );
        })}
      </div>
    </div>
  );
};
