import { useEffect, useRef, useCallback, useState, JSX } from 'react';
import { Search, X, GripVertical } from 'lucide-react';
import Trackers from '../trackers/Trackers';
import ActiveFilters from '../filters/ActiveFilters';
import type { LogEvent, TrackerState, FilterRule, FilterMode } from '../../types';
import './LogViewer.css';

interface LogViewerProps {
  logs: LogEvent[];
  trackerState: TrackerState;
  filterRules: FilterRule[];
  autoScroll: boolean;
  onScrollUp: () => void;
  onSetFilter: (pattern: string, mode: FilterMode) => void;
  onClearFilter: (pattern: string) => void;
  onNavigate: (pattern: string, direction: 'prev' | 'next') => void;
}

function getLogLevel(message: string): 'error' | 'warn' | 'info' | 'debug' | 'default' {
  const upper = message.toUpperCase();
  if (upper.includes('[ERROR]') || upper.includes(' ERROR ') || upper.includes('ERROR:')) return 'error';
  if (upper.includes('[WARN]') || upper.includes('[WARNING]') || upper.includes('WARN:')) return 'warn';
  if (upper.includes('[INFO]') || upper.includes('INFO:')) return 'info';
  if (upper.includes('[DEBUG]') || upper.includes('DEBUG:')) return 'debug';
  return 'default';
}

const MIN_PANEL_WIDTH = 180;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 280;

export default function LogViewer({
  logs, trackerState, filterRules, autoScroll, onScrollUp,
  onSetFilter, onClearFilter, onNavigate,
}: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search state
  const [search, setSearch] = useState('');

  // Resizable panel state
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(DEFAULT_PANEL_WIDTH);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < lastScrollRef.current) onScrollUp();
    lastScrollRef.current = el.scrollTop;
  }, [onScrollUp]);

  // ── Drag-to-resize logic ──────────────────────────────────────────────────
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [panelWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      // Dragging left increases panel width, right decreases
      const delta = dragStartXRef.current - e.clientX;
      const newWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, dragStartWidthRef.current + delta));
      setPanelWidth(newWidth);
    };
    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // ── Filter / search logic ─────────────────────────────────────────────────
  const searchLower = search.toLowerCase();
  const focusRules = filterRules.filter(r => r.mode === 'focus');
  const ignoreRules = filterRules.filter(r => r.mode === 'ignore');

  const matchesSearch = useCallback((msg: string) => {
    if (!searchLower) return true;
    return msg.toLowerCase().includes(searchLower);
  }, [searchLower]);

  const isIgnored = useCallback((msg: string) => {
    return ignoreRules.some(r => msg.includes(r.pattern.replace(/{[^}]+}/g, '')));
  }, [ignoreRules]);

  // Count search matches across all visible (non-ignored) logs
  const searchMatchCount = search
    ? logs.filter(l => !isIgnored(l.message) && matchesSearch(l.message)).length
    : 0;

  // ── Build rendered lines ──────────────────────────────────────────────────
  const rendered: JSX.Element[] = [];
  let i = 0;

  while (i < logs.length) {
    const log = logs[i];

    if (isIgnored(log.message)) {
      // Find contiguous block of ignored logs
      let j = i;
      while (j < logs.length && isIgnored(logs[j].message)) j++;
      const count = j - i;
      rendered.push(
        <IgnoredGroup key={`ignore-${i}`} count={count} logs={logs.slice(i, j)} startIndex={i} focusRules={focusRules} searchTerm={search} />,
      );
      i = j;
    } else {
      // Apply search filter: hide non-matching lines when search is active
      if (search && !matchesSearch(log.message)) {
        i++;
        continue;
      }
      rendered.push(
        <LogLine
          key={log.id}
          log={log}
          index={i}
          focusRules={focusRules}
          searchTerm={search}
        />,
      );
      i++;
    }
  }

  return (
    <div className="log-viewer" ref={containerRef}>

      {/* Log stream column */}
      <div className="log-stream-column">

        {/* Search bar */}
        <div className="log-search-bar">
          <Search size={14} className="log-search-icon" />
          <input
            className="log-search-input"
            placeholder="Filter logs... (plain text)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            spellCheck={false}
          />
          {search && (
            <>
              <span className="log-search-count">
                {searchMatchCount} match{searchMatchCount !== 1 ? 'es' : ''}
              </span>
              <button className="log-search-clear" onClick={() => setSearch('')} title="Clear search">
                <X size={13} />
              </button>
            </>
          )}
        </div>

        {/* Log stream */}
        <div className="log-stream" ref={scrollRef} onScroll={handleScroll}>
          {rendered.length === 0 ? (
            <div className="log-stream-empty">
              {search
                ? <p>No logs match "<strong>{search}</strong>"</p>
                : <p>No log events yet.</p>
              }
            </div>
          ) : rendered}
        </div>
      </div>

      {/* Drag handle divider */}
      <div
        className="log-divider"
        onMouseDown={handleDividerMouseDown}
        title="Drag to resize"
      >
        <GripVertical size={14} className="log-divider-icon" />
      </div>

      {/* Tracker panel */}
      <div className="log-tracker-panel" style={{ width: panelWidth }}>
        <Trackers
          trackerState={trackerState}
          filterRules={filterRules}
          onSetFilter={onSetFilter}
          onClearFilter={onClearFilter}
        />
        <ActiveFilters
          rules={filterRules}
          onNavigate={onNavigate}
          onRemove={onClearFilter}
        />
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function highlightText(text: string, term: string): JSX.Element {
  if (!term) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const parts: JSX.Element[] = [];
  let last = 0;
  let idx = lowerText.indexOf(lowerTerm, last);
  let key = 0;
  while (idx !== -1) {
    if (idx > last) parts.push(<span key={key++}>{text.slice(last, idx)}</span>);
    parts.push(<mark key={key++} className="log-search-highlight">{text.slice(idx, idx + term.length)}</mark>);
    last = idx + term.length;
    idx = lowerText.indexOf(lowerTerm, last);
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

function LogLine({
  log, index, focusRules, searchTerm,
}: {
  log: LogEvent;
  index: number;
  focusRules: FilterRule[];
  searchTerm: string;
}) {
  const level = getLogLevel(log.message);
  const timeStr = new Date(log.timestamp).toISOString().replace('T', ' ').split('.')[0];
  const groupShort = log.logGroup.split('/').pop() ?? log.logGroup;
  const matchedFocusRule = focusRules.find(r => log.message.includes(r.pattern.replace(/{[^}]+}/g, '')));

  return (
    <div
      data-log-index={index}
      className={`log-line level-${level} ${matchedFocusRule ? 'log-focused' : ''}`}
      style={matchedFocusRule?.color ? { '--focus-line-color': matchedFocusRule.color } as React.CSSProperties : undefined}
    >
      <span className="log-ts">{timeStr}</span>
      <span className="log-group-tag" title={log.logGroup}>{groupShort}</span>
      <span className={`log-level-tag level-${level}`}>{level.toUpperCase()}</span>
      <span className="log-msg">{highlightText(log.message, searchTerm)}</span>
    </div>
  );
}

function IgnoredGroup({
  count, logs, startIndex, focusRules, searchTerm,
}: {
  count: number;
  logs: LogEvent[];
  startIndex: number;
  focusRules: FilterRule[];
  searchTerm: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="log-ignored-group">
      <div className="log-ignored-summary">
        <span className="log-ignored-count">{count} message{count !== 1 ? 's' : ''} hidden</span>
        <button className="log-ignored-expand" onClick={() => setExpanded(v => !v)}>
          {expanded ? '▲ collapse' : '▼ expand'}
        </button>
      </div>
      {expanded && (
        <div className="log-ignored-detail">
          {logs.map((l, idx) => (
            <LogLine key={l.id} log={l} index={startIndex + idx} focusRules={focusRules} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
}
