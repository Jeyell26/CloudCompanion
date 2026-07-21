import { useRef, useEffect } from 'react';
import type { LogEvent } from '../../types';
import './cloudwatch.css';

interface CloudWatchLogsProps {
  logs: LogEvent[];
  selectedGroup: string;
  isTailing: boolean;
}

export default function CloudWatchLogs({ logs, selectedGroup, isTailing }: CloudWatchLogsProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTailing && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isTailing]);

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dots">
          <div className="terminal-dot close"></div>
          <div className="terminal-dot minimize"></div>
          <div className="terminal-dot expand"></div>
        </div>
        <div className="terminal-title">
          <span>{selectedGroup ? `stream://${selectedGroup}` : 'console'}</span>
        </div>
      </div>

      <div className="terminal-body cloudwatch-terminal-body">
        {logs.length === 0 ? (
          <div className="cloudwatch-empty-logs">
            No log statements found matching the filter criteria.
          </div>
        ) : (
          logs.map((log, idx) => {
            const dateStr = new Date(log.timestamp).toISOString();
            let logClass = 'terminal-line';
            if (log.message.includes('[ERROR]')) logClass += ' error';
            else if (log.message.includes('[WARNING]')) logClass += ' warning';
            else if (log.message.includes('[INFO]')) logClass += ' info';

            return (
              <div key={idx} className={`${logClass} cloudwatch-log-row`}>
                <span className="cloudwatch-log-timestamp">{dateStr}</span>
                <span>{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
