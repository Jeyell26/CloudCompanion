import { useEffect, useRef, useState, useCallback } from 'react';
import { Square, ChevronDown, Radio } from 'lucide-react';
import { createLiveTailStream } from './api/liveTailStream';
import LogViewer from '../log-viewer/LogViewer';
import type { LogEvent, LogGroup, FilterRule, FilterMode, LogPulseSettings } from '../../types';
import { createTrackerState, processLog } from '../trackers/trackerEngine';
import { addOrUpdateFilter, removeFilter, navigateOccurrence } from '../filters/filtersStore';
import { useLogBuffer } from '../../hooks/useLogBuffer';
import './LiveTail.css';

interface LiveTailProps {
  selectedGroups: LogGroup[];
  settings: LogPulseSettings;
  onStop: () => void;
}

export default function LiveTail({ selectedGroups, settings, onStop }: LiveTailProps) {
  const [trackerState, setTrackerState] = useState(createTrackerState());
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const streamRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  // Keep a stable ref to logs so the recompute effect doesn't re-run on every new log
  const logsRef = useRef<LogEvent[]>([]);

  const { logs, addLog, clearLogs, showOverflowPrompt, handleOverflowDrop, handleOverflowDownload } = useLogBuffer(
    settings.logBufferLimit,
    settings.overflowBehavior,
  );

  // Keep logsRef in sync so the recompute effect can read current logs
  logsRef.current = logs;

  const handleNewLog = useCallback((log: LogEvent) => {
    addLog(log);
    setTrackerState(prev => processLog(prev, log, settingsRef.current));
  }, [addLog]);

  // Recompute tracker from entire buffer when normalization rules change
  useEffect(() => {
    if (logsRef.current.length === 0) return;
    let ts = createTrackerState();
    for (const log of logsRef.current) {
      ts = processLog(ts, log, settingsRef.current);
    }
    setTrackerState(ts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.normalizationRules]);

  useEffect(() => {
    if (!isRunning) return;
    const groupNames = selectedGroups.map(g => g.name);
    streamRef.current = createLiveTailStream(groupNames, handleNewLog);
    return () => streamRef.current?.();
  }, [isRunning, selectedGroups, handleNewLog]);

  const handleStop = () => {
    streamRef.current?.();
    setIsRunning(false);
    onStop();
  };

  const handleSetFilter = useCallback((pattern: string, mode: FilterMode) => {
    setFilterRules(prev => addOrUpdateFilter(prev, pattern, mode));
  }, []);

  const handleClearFilter = useCallback((pattern: string) => {
    setFilterRules(prev => removeFilter(prev, pattern));
  }, []);

  const handleNavigate = useCallback((pattern: string, direction: 'prev' | 'next') => {
    setFilterRules(prev => navigateOccurrence(prev, pattern, direction).rules);
  }, []);

  return (
    <div className="live-tail-container">
      <div className="live-tail-header">
        <div className="live-tail-status">
          <span className={`live-dot ${isRunning ? 'running' : 'stopped'}`} />
          <Radio size={14} />
          <span>Live Tail</span>
          <span className="live-groups-hint">
            — {selectedGroups.map(g => g.name.split('/').pop()).join(', ')}
          </span>
        </div>
        <div className="live-tail-actions">
          {!autoScroll && (
            <button className="live-resume-btn" onClick={() => setAutoScroll(true)}>
              <ChevronDown size={14} /> Resume
            </button>
          )}
          <button className="live-stop-btn" onClick={handleStop}>
            <Square size={13} fill="currentColor" /> Stop
          </button>
        </div>
      </div>

      {showOverflowPrompt && (
        <div className="live-overflow-banner">
          <span>⚠️ Log buffer is full ({settings.logBufferLimit} logs). What should we do?</span>
          <button className="btn btn-sm btn-secondary" onClick={handleOverflowDrop}>Drop oldest</button>
          <button className="btn btn-sm btn-secondary" onClick={handleOverflowDownload}>Download & clear</button>
        </div>
      )}

      <LogViewer
        logs={logs}
        trackerState={trackerState}
        filterRules={filterRules}
        autoScroll={autoScroll}
        onScrollUp={() => setAutoScroll(false)}
        onSetFilter={handleSetFilter}
        onClearFilter={handleClearFilter}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
