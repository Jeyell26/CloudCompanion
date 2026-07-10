import { useState, useEffect, useRef } from 'react';
import type { LogEvent } from '../types';
import { getLogGroups, getLogs } from '../api';
import { Terminal as TerminalIcon, Search, Play, Pause, Trash2 } from 'lucide-react';

export default function CloudWatchPanel() {
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [filterText, setFilterText] = useState('');
  const [limit, setLimit] = useState(50);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isTailing, setIsTailing] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load log groups
  useEffect(() => {
    async function loadGroups() {
      try {
        const list = await getLogGroups();
        setGroups(list);
        if (list.length > 0) {
          setSelectedGroup(list[0]);
        }
      } catch (err) {
        console.error('Failed to load log groups', err);
      }
    }
    loadGroups();
  }, []);

  // Fetch logs on selector changes
  useEffect(() => {
    if (!selectedGroup) return;
    
    async function fetchInitialLogs() {
      try {
        const events = await getLogs(selectedGroup, filterText, limit);
        setLogs(events);
      } catch (err) {
        console.error('Failed to fetch logs', err);
      }
    }

    fetchInitialLogs();
  }, [selectedGroup, filterText, limit]);

  // Live log simulation when tailing is active
  useEffect(() => {
    if (!isTailing || !selectedGroup) return;

    const interval = setInterval(async () => {
      // Simulate new incoming log event lines
      const now = Date.now();
      const messages: Record<string, string[]> = {
        '/aws/lambda/processImage': [
          `[INFO] Image processed successfully - RequestId: req-${Math.random().toString(36).substr(2, 9)}`,
          `[DEBUG] GC garbage collection reclaimed 18.2 MB memory`,
          `[INFO] Thumbnail S3 caching completed in 42ms`
        ],
        '/aws/lambda/cleanupLogs': [
          `[INFO] Log rotation scan complete. 0 logs matched the expiration parameters.`,
          `[DEBUG] Next schedule run configured in 24 hours.`
        ],
        '/aws/lambda/iotTelemetryIngest': [
          `[INFO] Ingestion worker successfully published 1 telemetry packet to table.`,
          `[INFO] Device sensor-${Math.floor(Math.random() * 100)} health state verified: ACTIVE.`
        ],
        '/aws/ecs/production-api-server': [
          `2026-07-10T10:55:00Z [INFO] GET /api/v1/auth/me - Status 200 OK (User ID: usr-1)`,
          `2026-07-10T10:55:04Z [INFO] GET /api/aws/ec2 - Status 200 OK`,
          `2026-07-10T10:55:12Z [INFO] POST /api/aws/ec2/action - Status 200 OK`,
          `2026-07-10T10:55:20Z [WARNING] High CPU spike detected on instance database-replica: 84.5%`
        ],
        '/aws/apigateway/dashboard-gateway': [
          `2026-07-10T10:55:18Z - Method: GET, Path: /api/aws/cloudwatch/logs, Latency: 28ms, Status: 200`,
          `2026-07-10T10:55:22Z - Method: GET, Path: /api/aws/integrations/status, Latency: 12ms, Status: 200`
        ]
      };

      const groupMsgs = messages[selectedGroup] || [`[INFO] Normal heartbeat operational log line.`];
      const randomLine = groupMsgs[Math.floor(Math.random() * groupMsgs.length)];

      // Check if it matches search filter
      if (filterText && !randomLine.toLowerCase().includes(filterText.toLowerCase())) {
        return;
      }

      setLogs(prev => {
        const next = [...prev, { timestamp: now, message: randomLine }];
        return next.slice(-limit);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isTailing, selectedGroup, filterText, limit]);

  // Scroll to bottom when logs update
  useEffect(() => {
    if (isTailing && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isTailing]);

  const clearScreen = () => {
    setLogs([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div className="card-title">
          <TerminalIcon size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>CloudWatch Service Logs Explorer</span>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div className="log-filters-row">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Log Group:</span>
            <select
              className="select-input"
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
            >
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, minWidth: '200px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Text Match Filter:</span>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#6b7280' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', paddingTop: '7px', paddingBottom: '7px', fontSize: '13px' }}
                placeholder="Filter by keyword (e.g. ERROR, RequestId)"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '80px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Limit:</span>
            <select
              className="select-input"
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginTop: '4px' }}>
            <button
              onClick={() => setIsTailing(!isTailing)}
              className={`btn btn-sm ${isTailing ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isTailing ? <Pause size={12} /> : <Play size={12} />}
              <span>{isTailing ? 'Tailing...' : 'Tail Logs'}</span>
            </button>
            <button
              onClick={clearScreen}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Clear Console"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      <div className="terminal-window" style={{ flexGrow: 1 }}>
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot close"></div>
            <div className="terminal-dot minimize"></div>
            <div className="terminal-dot expand"></div>
          </div>
          <div className="terminal-title">
            <span>{selectedGroup ? `stream://${selectedGroup}` : 'console'}</span>
          </div>
        </div>

        <div className="terminal-body" style={{ height: '420px' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '100px 0' }}>
              No log statements found matching the filter criteria.
            </div>
          ) : (
            logs.map((log, idx) => {
              const dateStr = new Date(log.timestamp).toISOString();
              let logClass = 'terminal-line';
              if (log.message.includes('[ERROR]')) logClass += ' error';
              else if (log.message.includes('[WARNING]')) logClass += ' warning';
              else if (log.message.includes('[INFO]')) logClass += ' info';
              
              return (
                <div key={idx} className={logClass} style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', userSelect: 'none', minWidth: '180px' }}>{dateStr}</span>
                  <span>{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
