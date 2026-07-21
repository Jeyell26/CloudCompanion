import type { EC2Instance } from '../../types';
import { Play, Square, Loader2, Globe } from 'lucide-react';
import './ec2.css';

interface EC2ListProps {
  instances: EC2Instance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loadingMap: Record<string, boolean>;
  onAction: (id: string, action: 'start' | 'stop') => void;
}

export default function EC2List({
  instances,
  selectedId,
  onSelect,
  loadingMap,
  onAction
}: EC2ListProps) {
  return (
    <div className="glass-card padding-0 overflow-hidden">
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Instance details</th>
              <th>Type</th>
              <th>IP Address</th>
              <th>CPU Usage</th>
              <th>Current state</th>
              <th className="ec2-actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {instances.map(inst => {
              const isLoading = loadingMap[inst.id];
              const isSelected = selectedId === inst.id;
              return (
                <tr
                  key={inst.id}
                  className={`ec2-table-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect(inst.id)}
                >
                  <td>
                    <div className="ec2-cell-details">
                      <span className="ec2-inspector-value">{inst.name}</span>
                      <span className="ec2-cell-id">{inst.id}</span>
                    </div>
                  </td>
                  <td><code>{inst.type}</code></td>
                  <td>
                    <span className="ec2-ip-display">
                      <Globe size={12} style={{ color: 'var(--text-secondary)' }} />
                      {inst.ip || '-'}
                    </span>
                  </td>
                  <td>
                    {inst.status === 'running' ? (
                      <div className="ec2-cpu-wrapper">
                        <div className="ec2-cpu-bar-bg">
                          <div 
                            className="ec2-cpu-bar-fill" 
                            style={{ width: `${inst.cpu}%` }} 
                          />
                        </div>
                        <span className="ec2-cpu-percentage">{inst.cpu}%</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${inst.status}`}>{inst.status.toUpperCase()}</span>
                  </td>
                  <td className="ec2-actions-cell" onClick={e => e.stopPropagation()}>
                    {isLoading ? (
                      <Loader2 size={16} className="spinner" style={{ color: 'var(--text-muted)' }} />
                    ) : inst.status === 'stopped' ? (
                      <button
                        className="btn btn-success btn-sm"
                        title="Start Instance"
                        onClick={() => onAction(inst.id, 'start')}
                      >
                        <Play size={12} fill="currentColor" /> Start
                      </button>
                    ) : inst.status === 'running' ? (
                      <button
                        className="btn btn-danger btn-sm"
                        title="Stop Instance"
                        onClick={() => onAction(inst.id, 'stop')}
                      >
                        <Square size={12} fill="currentColor" /> Stop
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Transitioning...</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
