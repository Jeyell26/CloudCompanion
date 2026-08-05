import { Hash, Sparkles, ScanSearch, EyeOff, Pencil, Check, X, Regex } from 'lucide-react';
import type { TrackerState, FilterRule, FilterMode } from '../../types';
import { useState } from 'react';
import './Trackers.css';

interface TrackersProps {
  trackerState: TrackerState;
  filterRules: FilterRule[];
  onSetFilter: (pattern: string, mode: FilterMode, isRegex?: boolean) => void;
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
  onSetFilter: (pattern: string, mode: FilterMode, isRegex?: boolean) => void;
  onClearFilter: (pattern: string) => void;
  color?: string;
}) {
  const mode = getFilterMode(filterRules, pattern);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(pattern);
  const [isRegex, setIsRegex] = useState(false);

  if (isEditing) {
    return (
      <div className="tracker-item edit-mode">
        <div className="tracker-edit-inputs">
          <input
            className="tracker-edit-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            autoFocus
          />
          <button
            className={`tracker-regex-btn ${isRegex ? 'active' : ''}`}
            title="Use Regular Expression"
            onClick={() => setIsRegex(!isRegex)}
          >
            <Regex size={13} />
          </button>
        </div>
        <div className="tracker-edit-actions">
          <button className="tracker-save-btn focus" title="Focus this pattern" onClick={() => { onSetFilter(editValue, 'focus', isRegex); setIsEditing(false); }}>
            <ScanSearch size={13} />
          </button>
          <button className="tracker-save-btn ignore" title="Ignore this pattern" onClick={() => { onSetFilter(editValue, 'ignore', isRegex); setIsEditing(false); }}>
            <EyeOff size={13} />
          </button>
          <button className="tracker-cancel-btn" title="Cancel" onClick={() => setIsEditing(false)}>
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`tracker-item ${mode ? `mode-${mode}` : ''}`} style={color ? { '--focus-color': color } as React.CSSProperties : undefined}>
      <div className="tracker-item-text">
        <span className="tracker-item-pattern" title={pattern}>{pattern}</span>
        {count !== undefined && <span className="tracker-item-count">{count}x</span>}
      </div>
      <div className="tracker-item-actions">
        <button
          className="tracker-edit-btn"
          title="Edit filter (Regex)"
          onClick={() => { setEditValue(pattern); setIsRegex(false); setIsEditing(true); }}
        >
          <Pencil size={12} />
        </button>
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
