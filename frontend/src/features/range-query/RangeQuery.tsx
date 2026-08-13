import { useState, useCallback, useEffect, useRef } from 'react';
import { Calendar, Clock, Play, AlertCircle, Loader2 } from 'lucide-react';
import { fetchRangeQuery } from './api/fetchRangeQuery';
import LogViewer from '../log-viewer/LogViewer';
import type { LogEvent, LogGroup, TimeRange, FilterRule, FilterMode, LogPulseSettings, TrackerState } from '../../types';
import { createTrackerState, processLog } from '../trackers/trackerEngine';
import { addOrUpdateFilter, removeFilter, navigateOccurrence } from '../filters/filtersStore';
import { useLogBuffer } from '../../hooks/useLogBuffer';
import './RangeQuery.css';

interface RangeQueryProps {
  selectedGroups: LogGroup[];
  settings: LogPulseSettings;
  onBack: () => void;
}

function getDefaultRange(windowHours: number): TimeRange {
  const now = new Date();
  const start = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split('T');
  const [endDate, endTimeFull] = fmt(now);
  const [startDate, startTimeFull] = fmt(start);
  return {
    startDate,
    startTime: startTimeFull.split('.')[0],
    endDate,
    endTime: endTimeFull.split('.')[0],
  };
}

export default function RangeQuery({ selectedGroups, settings, onBack }: RangeQueryProps) {
  const [range, setRange] = useState<TimeRange>(() => getDefaultRange(settings.defaultTimeWindowHours));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ page: number; total: number } | null>(null);
  const [trackerState, setTrackerState] = useState<TrackerState>(createTrackerState());
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [hasResults, setHasResults] = useState(false);
  // Stable ref so the recompute effect can read current logs without stale closure
  const logsRef = useRef<LogEvent[]>([]);

  const { logs, addLog, clearLogs, showOverflowPrompt, handleOverflowDrop, handleOverflowDownload } = useLogBuffer(
    settings.logBufferLimit,
    settings.overflowBehavior,
  );

  // Keep logsRef in sync
  logsRef.current = logs;

  // Recompute tracker from entire buffer when normalization rules or filter rules change
  useEffect(() => {
    if (logsRef.current.length === 0) return;
    let ts = createTrackerState();
    for (const log of logsRef.current) {
      ts = processLog(ts, log, settings, filterRules);
    }
    setTrackerState(ts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.normalizationRules, filterRules]);

  const validateRange = (): string | null => {
    const start = new Date(`${range.startDate}T${range.startTime}`);
    const end = new Date(`${range.endDate}T${range.endTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid date or time format.';
    if (end <= start) return 'End time must be after start time.';
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours > settings.maxTimeWindowHours) {
      return `Range exceeds maximum of ${settings.maxTimeWindowHours} hours. Adjust in Settings.`;
    }
    return null;
  };

  const handleRun = async () => {
    const err = validateRange();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);
    setHasResults(false);
    clearLogs();
    setTrackerState(createTrackerState());
    setFilterRules([]);
    setProgress(null);

    try {
      const groupNames = selectedGroups.map(g => g.name);
      const events = await fetchRangeQuery(groupNames, range, (page, total) => setProgress({ page, total }));
      // Feed all logs into buffer and tracker
      let ts = createTrackerState();
      for (const log of events) {
        addLog(log);
        ts = processLog(ts, log, settings, []);
      }
      setTrackerState(ts);
      setHasResults(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Query failed.');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handleSetFilter = useCallback((pattern: string, mode: FilterMode, isRegex?: boolean) => {
    setFilterRules(prev => addOrUpdateFilter(prev, pattern, mode, undefined, isRegex));
  }, []);

  const handleClearFilter = useCallback((pattern: string) => {
    setFilterRules(prev => removeFilter(prev, pattern));
  }, []);

  const handleNavigate = useCallback((pattern: string, direction: 'prev' | 'next') => {
    setFilterRules(prev => navigateOccurrence(prev, pattern, direction).rules);
  }, []);

  const setField = (field: keyof TimeRange) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRange(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="rq-container">
      <div className="rq-form-bar">
        <div className="rq-form-row">
          <div className="rq-field">
            <label className="rq-label"><Calendar size={12}/> Start</label>
            <div className="rq-datetime">
              <input type="date" className="rq-input" value={range.startDate} onChange={setField('startDate')} />
              <input type="time" step="1" className="rq-input rq-time" value={range.startTime} onChange={setField('startTime')} />
            </div>
          </div>
          <div className="rq-field-sep">→</div>
          <div className="rq-field">
            <label className="rq-label"><Clock size={12}/> End</label>
            <div className="rq-datetime">
              <input type="date" className="rq-input" value={range.endDate} onChange={setField('endDate')} />
              <input type="time" step="1" className="rq-input rq-time" value={range.endTime} onChange={setField('endTime')} />
            </div>
          </div>
          <button
            className="rq-run-btn"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? <Loader2 size={15} className="rq-spin" /> : <Play size={14} fill="currentColor" />}
            {loading ? (progress ? `Fetching page ${progress.page}/${progress.total}...` : 'Fetching...') : 'Run Query'}
          </button>
          <button className="rq-back-btn" onClick={onBack}>← Back</button>
        </div>

        {error && (
          <div className="rq-error">
            <AlertCircle size={14}/> {error}
          </div>
        )}
      </div>

      {showOverflowPrompt && (
        <div className="live-overflow-banner">
          <span>⚠️ Log buffer is full. What should we do?</span>
          <button className="btn btn-sm btn-secondary" onClick={handleOverflowDrop}>Drop oldest</button>
          <button className="btn btn-sm btn-secondary" onClick={handleOverflowDownload}>Download & clear</button>
        </div>
      )}

      {hasResults || logs.length > 0 ? (
        <LogViewer
          logs={logs}
          trackerState={trackerState}
          filterRules={filterRules}
          normalizationRules={settings.normalizationRules}
          autoScroll={false}
          onScrollUp={() => {}}
          onSetFilter={handleSetFilter}
          onClearFilter={handleClearFilter}
          onNavigate={handleNavigate}
        />
      ) : !loading ? (
        <div className="rq-empty">
          <Calendar size={40} strokeWidth={1} />
          <p>Select a date/time range and run a query to view logs.</p>
        </div>
      ) : null}
    </div>
  );
}
