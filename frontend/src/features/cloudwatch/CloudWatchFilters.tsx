import { Search, Play, Pause, Trash2 } from 'lucide-react';
import './cloudwatch.css';

interface CloudWatchFiltersProps {
  groups: string[];
  selectedGroup: string;
  filterText: string;
  limit: number;
  isTailing: boolean;
  onGroupChange: (group: string) => void;
  onFilterChange: (filter: string) => void;
  onLimitChange: (limit: number) => void;
  onToggleTail: () => void;
  onClear: () => void;
}

export default function CloudWatchFilters({
  groups,
  selectedGroup,
  filterText,
  limit,
  isTailing,
  onGroupChange,
  onFilterChange,
  onLimitChange,
  onToggleTail,
  onClear
}: CloudWatchFiltersProps) {
  return (
    <div className="glass-card cloudwatch-filters-card">
      <div className="log-filters-row">
        <div className="cloudwatch-filter-group">
          <span className="cloudwatch-filter-label">Log Group:</span>
          <select
            className="select-input"
            value={selectedGroup}
            onChange={e => onGroupChange(e.target.value)}
          >
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="cloudwatch-filter-text-group">
          <span className="cloudwatch-filter-label">Text Match Filter:</span>
          <div className="cloudwatch-filter-search-wrapper">
            <Search size={14} className="cloudwatch-filter-search-icon" />
            <input
              type="text"
              className="form-input cloudwatch-filter-input"
              placeholder="Filter by keyword (e.g. ERROR, RequestId)"
              value={filterText}
              onChange={e => onFilterChange(e.target.value)}
            />
          </div>
        </div>

        <div className="cloudwatch-filter-limit-group">
          <span className="cloudwatch-filter-label">Limit:</span>
          <select
            className="select-input"
            value={limit}
            onChange={e => onLimitChange(Number(e.target.value))}
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
          </select>
        </div>

        <div className="cloudwatch-filter-actions">
          <button
            onClick={onToggleTail}
            className={`btn btn-sm ${isTailing ? 'btn-primary' : 'btn-secondary'} flex-align-center-gap-6`}
          >
            {isTailing ? <Pause size={12} /> : <Play size={12} />}
            <span>{isTailing ? 'Tailing...' : 'Tail Logs'}</span>
          </button>
          <button
            onClick={onClear}
            className="btn btn-secondary btn-sm flex-align-center-gap-6"
            title="Clear Console"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}
