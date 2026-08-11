import { Hash, Sparkles, ScanSearch, EyeOff, Pencil, Check, X } from 'lucide-react';
import type { TrackerState, FilterRule, FilterMode } from '../../types';
import { useState } from 'react';
import './Trackers.css';

interface TrackersProps {
  trackerState: TrackerState;
  filterRules: FilterRule[];
  onSetFilter: (pattern: string, mode: FilterMode, isRegex?: boolean) => void;
  onClearFilter: (pattern: string) => void;
}

function getMatchingRule(filterRules: FilterRule[], pattern: string): FilterRule | undefined {
  // Exact match first
  const exact = filterRules.find(r => r.pattern === pattern);
  if (exact) return exact;

  // Fallback to regex matches
  return filterRules.find(r => {
    if (r.isRegex) {
      try { return new RegExp(r.pattern).test(pattern); } catch (e) { return false; }
    }
    return pattern.includes(r.pattern.replace(/{[^}]+}/g, ''));
  });
}

function getFilterMode(filterRules: FilterRule[], pattern: string): FilterMode | null {
  return getMatchingRule(filterRules, pattern)?.mode ?? null;
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
  const matchingRule = getMatchingRule(filterRules, pattern);
  const mode = matchingRule?.mode ?? null;
  const isRegexRule = matchingRule?.isRegex ?? false;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(pattern);

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
        </div>
        <div className="tracker-edit-actions">
          <button className="tracker-save-btn group always-tint" title="Save as grouping rule" onClick={() => { onSetFilter(editValue, 'group', true); setIsEditing(false); }}>
            <Check size={13} />
          </button>
          <button className="tracker-save-btn focus always-tint" title="Focus this pattern" onClick={() => { onSetFilter(editValue, 'focus', true); setIsEditing(false); }}>
            <ScanSearch size={13} />
          </button>
          <button className="tracker-save-btn ignore always-tint" title="Ignore this pattern" onClick={() => { onSetFilter(editValue, 'ignore', true); setIsEditing(false); }}>
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
          onClick={() => { 
            setEditValue(isRegexRule ? pattern : pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); 
            setIsEditing(true); 
          }}
        >
          <Pencil size={12} />
        </button>
        <button
          className={`tracker-action-btn focus ${mode === 'focus' ? 'active' : ''}`}
          title={mode === 'focus' ? 'Clear focus' : 'Focus'}
          onClick={() => mode === 'focus' ? onClearFilter(pattern) : onSetFilter(pattern, 'focus', isRegexRule)}
        >
          <ScanSearch size={13} />
        </button>
        <button
          className={`tracker-action-btn ignore ${mode === 'ignore' ? 'active' : ''}`}
          title={mode === 'ignore' ? 'Clear ignore' : 'Ignore'}
          onClick={() => mode === 'ignore' ? onClearFilter(pattern) : onSetFilter(pattern, 'ignore', isRegexRule)}
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
                color={getMatchingRule(focusRules, entry.pattern)?.color}
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
                color={getMatchingRule(focusRules, entry.pattern)?.color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
