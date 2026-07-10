import { useState, useEffect } from 'react';
import type { EC2Instance } from '../types';
import { getEC2Instances, triggerEC2Action } from '../api';
import { Play, Square, Loader2, Server, Globe, Cpu, RefreshCw } from 'lucide-react';

export default function EC2Panel() {
  const [instances, setInstances] = useState<EC2Instance[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchInstances() {
    try {
      const data = await getEC2Instances();
      setInstances(data);
    } catch (err) {
      console.error('Failed to load EC2 instances', err);
    }
  }

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'start' | 'stop') => {
    setLoadingMap(prev => ({ ...prev, [id]: true }));
    try {
      await triggerEC2Action(id, action);
      // Wait for a second and refresh
      setTimeout(fetchInstances, 500);
    } catch (err) {
      alert('Error triggering EC2 action: ' + (err as Error).message);
    } finally {
      setLoadingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  const manualRefresh = async () => {
    setIsRefreshing(true);
    await fetchInstances();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const selectedInstance = instances.find(i => i.id === selectedId) || instances[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div className="card-title">
          <Server size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Elastic Compute Cloud (EC2) Instances</span>
        </div>
        <button
          onClick={manualRefresh}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          disabled={isRefreshing}
        >
          <RefreshCw size={12} className={isRefreshing ? 'spinner' : ''} />
          <span>Sync</span>
        </button>
      </div>

      <div className="grid-cols-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Instances Table Card */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Instance details</th>
                  <th>Type</th>
                  <th>IP Address</th>
                  <th>CPU Usage</th>
                  <th>Current state</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {instances.map(inst => {
                  const isLoading = loadingMap[inst.id];
                  const isSelected = selectedId === inst.id;
                  return (
                    <tr
                      key={inst.id}
                      style={{ cursor: 'pointer', background: isSelected ? 'rgba(255, 255, 255, 0.02)' : '' }}
                      onClick={() => setSelectedId(inst.id)}
                    >
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{inst.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{inst.id}</span>
                        </div>
                      </td>
                      <td><code style={{ fontSize: '12px' }}>{inst.type}</code></td>
                      <td>
                        <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={12} style={{ color: 'var(--text-muted)' }} />
                          {inst.ip || '-'}
                        </span>
                      </td>
                      <td>
                        {inst.status === 'running' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flexGrow: 1, height: '4px', width: '50px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: 'var(--accent-purple)', width: `${inst.cpu}%` }}></div>
                            </div>
                            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{inst.cpu}%</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${inst.status}`}>{inst.status.toUpperCase()}</span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        {isLoading ? (
                          <Loader2 size={16} className="spinner" style={{ display: 'inline', color: 'var(--text-muted)' }} />
                        ) : inst.status === 'stopped' ? (
                          <button
                            className="btn btn-success btn-sm"
                            title="Start Instance"
                            onClick={() => handleAction(inst.id, 'start')}
                          >
                            <Play size={12} fill="currentColor" /> Start
                          </button>
                        ) : inst.status === 'running' ? (
                          <button
                            className="btn btn-danger btn-sm"
                            title="Stop Instance"
                            onClick={() => handleAction(inst.id, 'stop')}
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

        {/* Selected Instance Detail Panel */}
        {selectedInstance && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Instance Inspector</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Resource configuration & metrics</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Resource Name:</span>
                <span style={{ fontWeight: 600 }}>{selectedInstance.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Instance ID:</span>
                <code style={{ fontSize: '11px' }}>{selectedInstance.id}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Instance State:</span>
                <span className={`badge ${selectedInstance.status}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                  {selectedInstance.status.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Compute Type:</span>
                <code>{selectedInstance.type}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Elastic Public IP:</span>
                <span>{selectedInstance.ip || 'None'}</span>
              </div>
              {selectedInstance.status === 'running' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>CPU Threads:</span>
                  <span>{selectedInstance.type.includes('xlarge') ? '4 vCPUs' : selectedInstance.type.includes('large') ? '2 vCPUs' : '1 vCPU'}</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Cpu size={24} style={{ color: 'var(--accent-purple)' }} />
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hourly Cost Billing</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedInstance.status === 'running'
                    ? `$${(selectedInstance.type.includes('xlarge') ? 0.16 : selectedInstance.type.includes('large') ? 0.08 : 0.02).toFixed(2)}/hour`
                    : '$0.00/hour (Suspended)'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
