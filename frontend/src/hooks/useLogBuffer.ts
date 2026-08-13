import { useState, useCallback, useRef } from 'react';
import type { LogEvent, OverflowBehavior } from '../types';

function downloadLogs(logs: LogEvent[]): void {
  const content = logs.map(l =>
    `${new Date(l.timestamp).toISOString()}\t${l.logGroup}\t${l.logStream}\t${l.message}`
  ).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logpulse-export-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useLogBuffer(limit: number, overflowBehavior: OverflowBehavior) {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [showOverflowPrompt, setShowOverflowPrompt] = useState(false);
  const pendingLogsRef = useRef<LogEvent[]>([]);

  const addLog = useCallback((log: LogEvent) => {
    setLogs(prev => {
      if (prev.length < limit) {
        return [...prev, log];
      }
      // At limit
      if (overflowBehavior === 'drop') {
        return [...prev.slice(1), log];
      }
      if (overflowBehavior === 'download') {
        downloadLogs(prev);
        return [log];
      }
      // 'ask'
      pendingLogsRef.current.push(log);
      setShowOverflowPrompt(true);
      return prev;
    });
  }, [limit, overflowBehavior]);

  const handleOverflowDrop = useCallback(() => {
    setLogs(prev => {
      const pending = pendingLogsRef.current;
      pendingLogsRef.current = [];
      return [...prev.slice(pending.length), ...pending];
    });
    setShowOverflowPrompt(false);
  }, []);

  const handleOverflowDownload = useCallback(() => {
    setLogs(prev => {
      downloadLogs(prev);
      const pending = pendingLogsRef.current;
      pendingLogsRef.current = [];
      return pending;
    });
    setShowOverflowPrompt(false);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    pendingLogsRef.current = [];
    setShowOverflowPrompt(false);
  }, []);

  return { logs, addLog, clearLogs, showOverflowPrompt, handleOverflowDrop, handleOverflowDownload };
}
