import React, { useEffect, useRef } from 'react';

export interface LogEntry {
  timestamp: string;
  type: 'info' | 'brain' | 'trade' | 'error';
  message: string;
}

interface BrainFeedProps {
  logs: LogEntry[];
}

export const BrainFeed: React.FC<BrainFeedProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass fade-in" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        AI Straight Reasoning Feed
      </h3>
      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          fontFamily: 'monospace', 
          padding: '1rem',
          fontSize: '0.85rem',
          lineHeight: '1.4'
        }}
      >
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '0.5rem', color: getLogColor(log.type) }}>
            <span style={{ opacity: 0.5 }}>[{log.timestamp}]</span> {' '}
            <span style={{ fontWeight: 'bold' }}>{log.type.toUpperCase()}:</span> {log.message}
          </div>
        ))}
        {logs.length === 0 && <div style={{ opacity: 0.3 }}>Waiting for reasoning data...</div>}
      </div>
    </div>
  );
};

const getLogColor = (type: LogEntry['type']) => {
  switch (type) {
    case 'brain': return 'var(--accent-color)';
    case 'trade': return 'var(--success-color)';
    case 'error': return 'var(--panic-color)';
    default: return 'var(--text-color)';
  }
};
