import React, { useEffect, useRef } from 'react';

export interface LogEntry {
  timestamp: string;
  type: 'info' | 'brain' | 'trade' | 'error';
  message: string;
}

interface BrainFeedProps {
  logs: LogEntry[];
}

const LOG_COLORS: Record<LogEntry['type'], string> = {
  brain: 'var(--accent)',
  trade: 'var(--green)',
  error: 'var(--red)',
  info: 'var(--text-muted)',
};

export const BrainFeed: React.FC<BrainFeedProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="glass brain-feed">
      <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: 0 }}>
        Reasoning Feed
      </h3>
      <div ref={scrollRef} className="brain-feed-body">
        {logs.length === 0
          ? <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>Waiting for agent…</span>
          : logs.map((log, i) => (
            <div key={i} className="log-entry" style={{ color: LOG_COLORS[log.type] }}>
              <span className="log-ts">[{log.timestamp}]</span>
              <span className="log-type">{log.type.toUpperCase()}</span>
              {log.message}
            </div>
          ))
        }
      </div>
    </div>
  );
};
