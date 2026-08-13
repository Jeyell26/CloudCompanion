import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Layers, Check } from 'lucide-react';
import { fetchLogGroups } from './api/fetchLogGroups';
import type { LogGroup } from '../../types';
import './LogGroupSelector.css';

interface LogGroupSelectorProps {
  selected: LogGroup[];
  onChange: (groups: LogGroup[]) => void;
}

export default function LogGroupSelector({ selected, onChange }: LogGroupSelectorProps) {
  const [groups, setGroups] = useState<LogGroup[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogGroups().then(g => { setGroups(g); setLoading(false); });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = (groups || []).filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  const isSelected = (g: LogGroup) => selected.some(s => s.name === g.name);

  const toggle = (g: LogGroup) => {
    if (isSelected(g)) onChange(selected.filter(s => s.name !== g.name));
    else onChange([...selected, g]);
  };

  const removeSelected = (g: LogGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(s => s.name !== g.name));
  };

  return (
    <div className="lgs-wrapper" ref={dropdownRef}>
      <label className="lgs-label">
        <Layers size={13} />
        Log Groups
        <span className="lgs-required">*</span>
      </label>

      <div className={`lgs-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(v => !v)}>
        {selected.length === 0 ? (
          <span className="lgs-placeholder">
            {loading ? 'Loading log groups...' : 'Select log groups to monitor...'}
          </span>
        ) : (
          <div className="lgs-chips">
            {selected.map(g => (
              <span key={g.name} className="lgs-chip">
                {g.name.split('/').pop()}
                <button className="lgs-chip-remove" onClick={e => removeSelected(g, e)}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <ChevronDown size={16} className={`lgs-chevron ${isOpen ? 'up' : ''}`} />
      </div>

      {isOpen && (
        <div className="lgs-dropdown">
          <div className="lgs-search-wrap">
            <Search size={14} className="lgs-search-icon" />
            <input
              className="lgs-search"
              placeholder="Search log groups..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && <button className="lgs-search-clear" onClick={() => setSearch('')}><X size={13}/></button>}
          </div>
          <ul className="lgs-list">
            {filtered.length === 0 && (
              <li className="lgs-empty">No log groups found</li>
            )}
            {filtered.map(g => (
              <li
                key={g.name}
                className={`lgs-item ${isSelected(g) ? 'selected' : ''}`}
                onClick={() => toggle(g)}
              >
                <span className={`lgs-item-check ${isSelected(g) ? 'visible' : ''}`}>
                  <Check size={12} />
                </span>
                <div className="lgs-item-info">
                  <span className="lgs-item-name">{g.name}</span>
                  {g.retentionDays && <span className="lgs-item-meta">{g.retentionDays}d retention</span>}
                </div>
              </li>
            ))}
          </ul>
          {selected.length > 0 && (
            <div className="lgs-dropdown-footer">
              <span>{selected.length} selected</span>
              <button className="lgs-clear-all" onClick={() => onChange([])}>
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
