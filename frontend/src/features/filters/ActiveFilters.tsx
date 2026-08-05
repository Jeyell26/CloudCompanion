import { ChevronLeft, ChevronRight, X, ScanSearch, EyeOff } from 'lucide-react';
import type { FilterRule } from '../../types';
import './ActiveFilters.css';

interface ActiveFiltersProps {
  rules: FilterRule[];
  onNavigate: (pattern: string, direction: 'prev' | 'next') => void;
  onRemove: (pattern: string) => void;
}

export default function ActiveFilters({ rules, onNavigate, onRemove }: ActiveFiltersProps) {
  if (rules.length === 0) return null;

  return (
    <div className="af-panel">
      <div className="af-header">Active Filters</div>
      {rules.map(rule => (
        <div
          key={rule.id}
          className={`af-rule ${rule.mode}`}
          style={rule.color ? { '--rule-color': rule.color } as React.CSSProperties : undefined}
        >
          <div className="af-rule-icon">
            {rule.mode === 'focus' ? <ScanSearch size={12}/> : <EyeOff size={12}/>}
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

          <button className="af-remove" onClick={() => onRemove(rule.pattern)} title="Remove filter">
            <X size={12}/>
          </button>
        </div>
      ))}
    </div>
  );
}
