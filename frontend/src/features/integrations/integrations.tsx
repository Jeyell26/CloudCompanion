import { useState, useEffect } from 'react';
import type { IntegrationStatus } from '../../types';
import { getIntegrationStatus } from './api';
import { Layers, RefreshCw } from 'lucide-react';
import ApiGatewayCard from './components/ApiGatewayCard';
import IoTBrokerCard from './components/IoTBrokerCard';
import MqttTerminal from './components/MqttTerminal';
import './integrations.css';

function Integrations() {
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
        <ApiGatewayCard status={status} />
        <IoTBrokerCard
          status={status}
          manualTopic={manualTopic}
          manualPayload={manualPayload}
          onTopicChange={setManualTopic}
          onPayloadChange={setManualPayload}
          onPublish={handlePublish}
        />
      </div>

      <MqttTerminal mqttLogs={mqttLogs} />
    </div>
  );
}

export default Integrations;
