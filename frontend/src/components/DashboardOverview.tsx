import { useState, useEffect } from 'react';
import type { EC2Instance, LambdaFunction, IntegrationStatus } from '../types';
import { getEC2Instances, getLambdas, getIntegrationStatus } from '../api';
import { Server, Activity, ShieldAlert, Cpu, DollarSign, Wifi, Terminal } from 'lucide-react';

export default function DashboardOverview() {
  const [ec2, setEc2] = useState<EC2Instance[]>([]);
  const [lambdas, setLambdas] = useState<LambdaFunction[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(15));
  const [telemetry, setTelemetry] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const [ec2Data, lambdaData, integrationData] = await Promise.all([
          getEC2Instances(),
          getLambdas(),
          getIntegrationStatus()
        ]);
        if (!active) return;
        setEc2(ec2Data);
        setLambdas(lambdaData);
        setIntegrations(integrationData);

        // Update CPU average utilization
        const runningEc2 = ec2Data.filter(i => i.status === 'running');
        const avgCpu = runningEc2.length > 0
          ? runningEc2.reduce((sum, i) => sum + i.cpu, 0) / runningEc2.length
          : 0;

        setCpuHistory(prev => [...prev.slice(1), Number(avgCpu.toFixed(1))]);
      } catch (err) {
        console.error('Error fetching dashboard overview data', err);
      }
    }

    loadStats();
    const interval = setInterval(loadStats, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Telemetry real-time simulator
  useEffect(() => {
    const devices = ['sensor-01', 'sensor-02', 'gateway-prod', 'weather-station-12'];
    const interval = setInterval(() => {
      const dev = devices[Math.floor(Math.random() * devices.length)];
      const val = (Math.random() * 10 + 20).toFixed(1);
      const newMsg = {
        timestamp: new Date().toLocaleTimeString(),
        device: dev,
        payload: { temp: `${val}°C`, status: 'OK', rssi: `${Math.floor(Math.random() * 20 - 80)}dBm` }
      };
      setTelemetry(prev => [newMsg, ...prev.slice(0, 4)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const runningCount = ec2.filter(i => i.status === 'running').length;
  const totalCount = ec2.length;
  const lambdaCount = lambdas.length;

  // Build SVG points for CPU graph
  const maxCpu = 100;
  const points = cpuHistory.map((val, index) => {
    const x = (index / (cpuHistory.length - 1)) * 300;
    const y = 100 - (val / maxCpu) * 80; // keep it within 20-100 range for visuals
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      {/* Metrics Row */}
      <div className="grid-cols-4">
        <div className="glass-card metric-card">
          <div className="metric-content">
            <span className="metric-label">EC2 Instances</span>
            <span className="metric-value">{runningCount} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ {totalCount}</span></span>
            <div className="metric-trend" style={{ color: 'var(--color-success)' }}>
              <Server size={12} />
              <span>{runningCount} active servers</span>
            </div>
          </div>
          <div className="metric-icon-box purple">
            <Server size={22} />
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-content">
            <span className="metric-label">Lambda Functions</span>
            <span className="metric-value">{lambdaCount}</span>
            <div className="metric-trend" style={{ color: 'var(--accent-cyan)' }}>
              <Activity size={12} />
              <span>{lambdas.reduce((sum, f) => sum + f.invocations, 0)} total invokes</span>
            </div>
          </div>
          <div className="metric-icon-box cyan">
            <Activity size={22} />
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-content">
            <span className="metric-label">Active Alarm State</span>
            <span className="metric-value" style={{ color: 'var(--color-success)' }}>0</span>
            <div className="metric-trend" style={{ color: 'var(--color-success)' }}>
              <ShieldAlert size={12} />
              <span>System status healthy</span>
            </div>
          </div>
          <div className="metric-icon-box success">
            <ShieldAlert size={22} />
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-content">
            <span className="metric-label">Proj. AWS Bill</span>
            <span className="metric-value">$0.12</span>
            <div className="metric-trend" style={{ color: 'var(--color-success)' }}>
              <DollarSign size={12} />
              <span>Free-tier compliant</span>
            </div>
          </div>
          <div className="metric-icon-box warning">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Main Graphs & Telemetry */}
      <div className="grid-cols-2">
        {/* CPU Sparkline Graph */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={18} style={{ color: 'var(--accent-purple)' }} />
              <span>Average Fleet CPU Utilization (%)</span>
            </div>
            <span className="badge running">LIVE FEED</span>
          </div>

          <div style={{ padding: '10px 0' }}>
            <svg viewBox="0 0 300 100" style={{ width: '100%', height: '150px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="cpuGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Horizontal Grid lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />

              {/* Area path */}
              <path
                d={`M 0,100 L ${points} L 300,100 Z`}
                fill="url(#cpuGlow)"
              />
              {/* Line path */}
              <polyline
                fill="none"
                stroke="var(--accent-purple)"
                strokeWidth="2"
                points={points}
              />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              <span>60s ago</span>
              <span>Average CPU: {cpuHistory[cpuHistory.length - 1]}%</span>
              <span>Now</span>
            </div>
          </div>
        </div>

        {/* Telemetry Stream Ticker */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <Wifi size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span>IoT Core MQTT Telemetry Stream</span>
            </div>
            <div className="backend-status-badge connected" style={{ fontSize: '10px', padding: '2px 8px' }}>
              <span className="status-dot pulse" />
              <span>Broker Live ({integrations?.iot.connections ?? 0} active)</span>
            </div>
          </div>

          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {telemetry.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Waiting for telemetry broker packets...
              </div>
            ) : (
              telemetry.map((msg, index) => (
                <div key={index} className="telemetry-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>[{msg.timestamp}]</span>
                    <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{msg.device}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    <code style={{ fontSize: '11px', background: 'none', padding: 0, color: 'var(--accent-cyan)' }}>
                      {JSON.stringify(msg.payload)}
                    </code>
                  </div>
                  <span className="badge running" style={{ fontSize: '9px', padding: '1px 4px' }}>MQTT</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Diagnostics SRE Console */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title">
            <Terminal size={18} />
            <span>SRE Auto-Alert Health Checklist</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
            <span>SSL Certification Status (CloudFront Edge)</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ SECURE (Expires in 88 days)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
            <span>API Gateway Access Controller Permissions</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ ACTIVE (IAM Least-privilege applied)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
            <span>Secrets Rotation (Secrets Manager)</span>
            <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>⚠ WARNING (Rotation past due: 2 secrets)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
            <span>S3 Static Hosting CDN Caching</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ CACHED (Edge hit rate 94.2%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
