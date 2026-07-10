import { useState, useEffect, useRef } from 'react';
import type { IntegrationStatus } from '../types';
import { getIntegrationStatus } from '../api';
import { Globe, Radio, Send, RefreshCw, Layers, Terminal } from 'lucide-react';

export default function IntegrationsPanel() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [mqttLogs, setMqttLogs] = useState<string[]>([]);
  const [manualTopic, setManualTopic] = useState('devices/custom/data');
  const [manualPayload, setManualPayload] = useState('{"message": "Hello AWS"}');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  async function fetchStatus() {
    try {
      const data = await getIntegrationStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load integration status', err);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // MQTT Broker Live Log Generator
  useEffect(() => {
    const devices = ['sensor-01', 'sensor-05', 'gateway-office', 'weather-station'];
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString();
      const dev = devices[Math.floor(Math.random() * devices.length)];
      const temp = (Math.random() * 8 + 18).toFixed(2);
      const battery = Math.floor(Math.random() * 20 + 80);
      
      const lines = [
        `[${time}] [MQTT] [PUB] clientId: ${dev} | topic: devices/${dev}/telemetry | QoS: 0 | payload: {"temperature":${temp},"battery":${battery}}`,
        `[${time}] [MQTT] [SUB] clientId: ${dev} | topic: commands/${dev}/control | QoS: 1`,
        `[${time}] [MQTT] [PINGREQ] clientId: ${dev} received`,
        `[${time}] [MQTT] [PINGRESP] clientId: ${dev} dispatched`
      ];

      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      setMqttLogs(prev => [...prev.slice(-40), randomLine]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll MQTT Terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mqttLogs]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const time = new Date().toLocaleTimeString();
    
    // Validate JSON
    try {
      JSON.parse(manualPayload);
    } catch (err) {
      alert('Invalid JSON Payload');
      return;
    }

    const pubLine = `[${time}] [MQTT] [PUB] clientId: CompanionDashboardConsole | topic: ${manualTopic} | QoS: 1 | payload: ${manualPayload}`;
    
    setMqttLogs(prev => [...prev, pubLine]);
    if (status) {
      setStatus({
        ...status,
        iot: {
          ...status.iot,
          messagesReceived: status.iot.messagesReceived + 1
        }
      });
    }
  };

  const manualRefresh = async () => {
    setIsRefreshing(true);
    await fetchStatus();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div className="card-title">
          <Layers size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Application Integrations (API Gateway & IoT Core)</span>
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

      <div className="grid-cols-2">
        {/* API Gateway Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} style={{ color: 'var(--accent-purple)' }} />
              <span>API Gateway Router: /api/*</span>
            </h3>
            <span className="badge running">API ACTIVE</span>
          </div>

          <div className="grid-cols-2" style={{ gap: '12px', marginBottom: 0 }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total API Requests</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>
                {status?.apiGateway.requestCount || 0}
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Average Error Rate</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: 'var(--color-success)' }}>
                {status?.apiGateway.errorRate.toFixed(2)}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Mapping Routes:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
              {status?.apiGateway.routes.map(r => (
                <div key={r} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--accent-cyan)' }}>{r}</span>
                  <span style={{ color: 'var(--text-muted)' }}>INTEGRATION: LAMBDA</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* IoT Core Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>IoT Device Telemetry Broker</span>
            </h3>
            <span className="badge running" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', borderColor: 'rgba(6,182,212,0.2)' }}>
              BROKER UP
            </span>
          </div>

          <div className="grid-cols-2" style={{ gap: '12px', marginBottom: 0 }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Active MQTT Connections</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>
                {status?.iot.connections || 0} devices
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Messages Received</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>
                {status?.iot.messagesReceived || 0}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Test Publish Message Payload:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '12px', flexGrow: 1, fontFamily: 'var(--font-mono)' }}
                  placeholder="topic/subtopic"
                  value={manualTopic}
                  onChange={e => setManualTopic(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '12px', width: '160px', fontFamily: 'var(--font-mono)' }}
                  placeholder='{"temp": 24}'
                  value={manualPayload}
                  onChange={e => setManualPayload(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 12px' }} title="Publish Packet">
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* MQTT Broker Log Console Terminal */}
      <div className="terminal-window" style={{ flexGrow: 1 }}>
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot close"></div>
            <div className="terminal-dot minimize"></div>
            <div className="terminal-dot expand"></div>
          </div>
          <div className="terminal-title">
            <Terminal size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            <span>iot-core-message-broker.log</span>
          </div>
        </div>

        <div className="terminal-body" style={{ height: '240px' }}>
          {mqttLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
              Initializing telemetry subscriptions. Listening for MQTT packet transmissions...
            </div>
          ) : (
            mqttLogs.map((log, idx) => {
              let lineClass = 'terminal-line';
              if (log.includes('[PUB]')) lineClass += ' info';
              if (log.includes('[SUB]')) lineClass += ' system';
              return (
                <div key={idx} className={lineClass} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  {log}
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
