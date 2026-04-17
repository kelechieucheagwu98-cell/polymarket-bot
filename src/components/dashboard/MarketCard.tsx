import React from 'react';
import { Market } from '../../services/polymarket/gamma';

interface MarketCardProps {
  market: Market;
  isSelected: boolean;
  onSelect: (market: Market) => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market, isSelected, onSelect }) => {
  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  return (
    <div 
      className={`glass fade-in ${isSelected ? 'selected' : ''}`} 
      onClick={() => onSelect(market)}
      style={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)',
        padding: '1rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
          {market.negRisk ? 'NEG RISK' : 'STANDARD'}
        </span>
        <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
          Vol: {formatVolume(market.volume)}
        </span>
      </div>
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'white' }}>
        {market.question}
      </h4>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {market.outcomes.map((outcome, i) => {
          const price = parseFloat(market.outcomePrices[i] || '0');
          return (
            <div key={i} style={{ 
              fontSize: '0.75rem', 
              background: 'rgba(255,255,255,0.05)', 
              padding: '2px 8px', 
              borderRadius: '4px' 
            }}>
              {outcome}: {(price * 100).toFixed(0)}%
            </div>
          );
        })}
      </div>
    </div>
  );
};
