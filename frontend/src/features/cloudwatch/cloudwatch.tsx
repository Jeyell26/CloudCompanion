import { useState, useEffect } from 'react';
import type { LogEvent } from '../../types';
import { getLogGroups, getLogs } from './api';
import { Terminal as TerminalIcon } from 'lucide-react';
import CloudWatchFilters from './components/CloudWatchFilters';
import CloudWatchLogs from './components/CloudWatchLogs';
import './cloudwatch.css';

export default function CloudWatch() {
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [filterText, setFilterText] = useState('');
  const [limit, setLimit] = useState(50);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isTailing, setIsTailing] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const list = await getLogGroups();
        setGroups(list);
        if (list.length > 0) setSelectedGroup(list[0]);
      } catch (err) {
        console.error('Failed to load log groups', err);
      }
    }
    loadGroups();
  }, []);

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

  useEffect(() => {
    if (!isTailing || !selectedGroup) return;

    const interval = setInterval(async () => {
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
          `2026-07-10T10:55:20Z [WARNING] High CPU spike detected on instance database-replica: 84.5%`
        ],
        '/aws/apigateway/dashboard-gateway': [
          `2026-07-10T10:55:18Z - Method: GET, Path: /api/aws/cloudwatch/logs, Latency: 28ms, Status: 200`,
          `2026-07-10T10:55:22Z - Method: GET, Path: /api/aws/integrations/status, Latency: 12ms, Status: 200`
        ]
      };

      const groupMsgs = messages[selectedGroup] || [`[INFO] Normal heartbeat operational log line.`];
      const randomLine = groupMsgs[Math.floor(Math.random() * groupMsgs.length)];

      if (filterText && !randomLine.toLowerCase().includes(filterText.toLowerCase())) return;

      setLogs(prev => [...prev, { timestamp: now, message: randomLine }].slice(-limit));
    }, 3000);

    return () => clearInterval(interval);
  }, [isTailing, selectedGroup, filterText, limit]);

  return (
    <div className="cloudwatch-container">
      <div className="card-header margin-bottom-0">
        <div className="card-title">
          <TerminalIcon size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>CloudWatch Service Logs Explorer</span>
        </div>
      </div>

      <CloudWatchFilters
        groups={groups}
        selectedGroup={selectedGroup}
        filterText={filterText}
        limit={limit}
        isTailing={isTailing}
        onGroupChange={setSelectedGroup}
        onFilterChange={setFilterText}
        onLimitChange={setLimit}
        onToggleTail={() => setIsTailing(!isTailing)}
        onClear={() => setLogs([])}
      />

      <CloudWatchLogs
        logs={logs}
        selectedGroup={selectedGroup}
        isTailing={isTailing}
      />
    </div>
  );
}
