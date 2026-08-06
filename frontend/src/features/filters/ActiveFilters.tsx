import { ChevronLeft, ChevronRight, X, ScanSearch, EyeOff, Check, Pencil, Regex } from 'lucide-react';
import type { FilterRule, FilterMode } from '../../types';
import { useState } from 'react';
import './ActiveFilters.css';

interface ActiveFiltersProps {
  rules: FilterRule[];
  onNavigate: (pattern: string, direction: 'prev' | 'next') => void;
  onRemove: (pattern: string) => void;
  onSetFilter?: (pattern: string, mode: FilterMode, isRegex?: boolean) => void;
}

function ActiveFilterItem({
  rule, onNavigate, onRemove, onSetFilter
}: {
  rule: FilterRule;
  onNavigate: (pattern: string, direction: 'prev' | 'next') => void;
  onRemove: (pattern: string) => void;
  onSetFilter?: (pattern: string, mode: FilterMode, isRegex?: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(rule.pattern);

  const handleSave = (mode: FilterMode) => {
    if (onSetFilter) {
      if (editValue !== rule.pattern) {
        onRemove(rule.pattern); // Remove old pattern
      }
      onSetFilter(editValue, mode, true);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="tracker-item edit-mode" style={{ margin: '4px 0', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px' }}>
        <div className="tracker-edit-inputs">
          <input
            className="tracker-edit-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            autoFocus
          />
        </div>
        <div className="tracker-edit-actions">
          <button className="tracker-save-btn group always-tint" title="Save as grouping rule" onClick={() => handleSave('group')}>
            <Check size={13} />
          </button>
          <button className="tracker-save-btn focus always-tint" title="Focus this pattern" onClick={() => handleSave('focus')}>
            <ScanSearch size={13} />
          </button>
          <button className="tracker-save-btn ignore always-tint" title="Ignore this pattern" onClick={() => handleSave('ignore')}>
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
    <div
      className={`af-rule ${rule.mode}`}
      style={rule.color ? { '--rule-color': rule.color } as React.CSSProperties : undefined}
    >
      <div className="af-rule-icon">
        {rule.mode === 'focus' ? <ScanSearch size={12}/> : 
         rule.mode === 'ignore' ? <EyeOff size={12}/> : 
         <Check size={12}/>}
      </div>
      {rule.isRegex && <span className="af-regex-badge" title="Regular Expression">.*</span>}
      <span className="af-rule-pattern" title={rule.pattern}>{rule.pattern}</span>

      {rule.mode === 'focus' && rule.occurrenceIndices.length > 0 && (
        <div className="af-nav">
          <button className="af-nav-btn" onClick={() => onNavigate(rule.pattern, 'prev')} title="Previous">
            <ChevronLeft size={12}/>
          </button>
          <span className="af-nav-count">
            {rule.currentOccurrence + 1}/{rule.occurrenceIndices.length}
          </span>
          <button className="af-nav-btn" onClick={() => onNavigate(rule.pattern, 'next')} title="Next">
            <ChevronRight size={12}/>
          </button>
        </div>
      )}

      <div className="af-actions" style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }}>
        {onSetFilter && (
          <button className="af-remove" onClick={() => { 
            setEditValue(rule.isRegex ? rule.pattern : rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); 
            setIsEditing(true); 
          }} title="Edit filter">
            <Pencil size={12}/>
          </button>
        )}
        <button className="af-remove" onClick={() => onRemove(rule.pattern)} title="Remove filter">
          <X size={12}/>
        </button>
      </div>
    </div>
  );
}

export default function ActiveFilters({ rules, onNavigate, onRemove, onSetFilter }: ActiveFiltersProps) {
  if (rules.length === 0) return null;

  return (
    <div className="af-panel">
      <div className="af-header">Active Filters</div>
      {rules.map(rule => (
        <ActiveFilterItem
          key={rule.id}
          rule={rule}
          onNavigate={onNavigate}
          onRemove={onRemove}
          onSetFilter={onSetFilter}
        />
      ))}
    </div>
  );
}
