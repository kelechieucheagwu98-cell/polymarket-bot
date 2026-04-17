import React from 'react';

interface TuningParams {
  aggressiveness: number;
  riskTolerance: 'low' | 'medium' | 'high';
  interval: number;
}

interface TuningPanelProps {
  params: TuningParams;
  onChange: (params: TuningParams) => void;
}

export const TuningPanel: React.FC<TuningPanelProps> = ({ params, onChange }) => {
  return (
    <div className="glass fade-in" style={{ height: '100%' }}>
      <h3>Tuning Interface</h3>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <label>Aggressiveness: {params.aggressiveness}</label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          value={params.aggressiveness}
          onChange={(e) => onChange({ ...params, aggressiveness: parseInt(e.target.value) })}
          style={{ accentColor: 'var(--accent-color)' }}
        />
        <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Higher = larger trade sizes & lower confidence threshold.</p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label>Risk Tolerance</label>
        <select 
          value={params.riskTolerance}
          onChange={(e) => onChange({ ...params, riskTolerance: e.target.value as any })}
        >
          <option value="low">Low (Safe Only)</option>
          <option value="medium">Medium (Balanced)</option>
          <option value="high">High (Maximum Opportunity)</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label>Scan Interval: {params.interval}s</label>
        <input 
          type="range" 
          min="5" 
          max="60" 
          step="5"
          value={params.interval}
          onChange={(e) => onChange({ ...params, interval: parseInt(e.target.value) })}
        />
      </div>
    </div>
  );
};
