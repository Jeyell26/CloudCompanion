import { Hash, Sparkles, ScanSearch, EyeOff } from 'lucide-react';
import type { TrackerState, FilterRule, FilterMode } from '../../types';
import './Trackers.css';

interface TrackersProps {
  trackerState: TrackerState;
  filterRules: FilterRule[];
  onSetFilter: (pattern: string, mode: FilterMode) => void;
  onClearFilter: (pattern: string) => void;
}

function getFilterMode(filterRules: FilterRule[], pattern: string): FilterMode | null {
  return filterRules.find(r => r.pattern === pattern)?.mode ?? null;
}

function TrackerItem({
  pattern, count, filterRules, onSetFilter, onClearFilter, color
}: {
  pattern: string;
  count?: number;
  filterRules: FilterRule[];
  onSetFilter: (pattern: string, mode: FilterMode) => void;
  onClearFilter: (pattern: string) => void;
  color?: string;
}) {
  const mode = getFilterMode(filterRules, pattern);

  return (
    <div className={`tracker-item ${mode ? `mode-${mode}` : ''}`} style={color ? { '--focus-color': color } as React.CSSProperties : undefined}>
      <div className="tracker-item-text">
        <span className="tracker-item-pattern" title={pattern}>{pattern}</span>
        {count !== undefined && <span className="tracker-item-count">{count}x</span>}
      </div>
      <div className="tracker-item-actions">
        <button
          className={`tracker-action-btn focus ${mode === 'focus' ? 'active' : ''}`}
          title={mode === 'focus' ? 'Clear focus' : 'Focus'}
          onClick={() => mode === 'focus' ? onClearFilter(pattern) : onSetFilter(pattern, 'focus')}
        >
          <ScanSearch size={13} />
        </button>
        <button
          className={`tracker-action-btn ignore ${mode === 'ignore' ? 'active' : ''}`}
          title={mode === 'ignore' ? 'Clear ignore' : 'Ignore'}
          onClick={() => mode === 'ignore' ? onClearFilter(pattern) : onSetFilter(pattern, 'ignore')}
        >
          <EyeOff size={13} />
        </button>
      </div>
    </div>
  );
}

export default function Trackers({ trackerState, filterRules, onSetFilter, onClearFilter }: TrackersProps) {
  const focusRules = filterRules.filter(r => r.mode === 'focus');

  return (
    <div className="trackers-panel">

      <div className="tracker-section">
        <div className="tracker-section-header">
          <Hash size={14} />
          Most Common
          <span className="tracker-count-badge">{trackerState.mostCommon.length}</span>
        </div>
        {trackerState.mostCommon.length === 0 ? (
          <p className="tracker-empty">Waiting for logs...</p>
        ) : (
          <div className="tracker-list">
            {trackerState.mostCommon.map((entry) => (
              <TrackerItem
                key={entry.pattern}
                pattern={entry.pattern}
                count={entry.count}
                filterRules={filterRules}
                onSetFilter={onSetFilter}
                onClearFilter={onClearFilter}
                color={focusRules.find(r => r.pattern === entry.pattern)?.color}
              />
            ))}
          </div>
        )}
      </div>

      <div className="tracker-section">
        <div className="tracker-section-header">
          <Sparkles size={14} />
          New Messages
          <span className="tracker-count-badge">{trackerState.newMessages.length}</span>
        </div>
        {trackerState.newMessages.length === 0 ? (
          <p className="tracker-empty">No new patterns yet...</p>
        ) : (
          <div className="tracker-list">
            {trackerState.newMessages.map((entry) => (
              <TrackerItem
                key={entry.pattern}
                pattern={entry.pattern}
                filterRules={filterRules}
                onSetFilter={onSetFilter}
                onClearFilter={onClearFilter}
                color={focusRules.find(r => r.pattern === entry.pattern)?.color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
