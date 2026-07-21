import type { IntegrationStatus } from '../../../types';
import { Radio, Send } from 'lucide-react';
import '../integrations.css';

interface IoTBrokerCardProps {
  status: IntegrationStatus | null;
  manualTopic: string;
  manualPayload: string;
  onTopicChange: (v: string) => void;
  onPayloadChange: (v: string) => void;
  onPublish: (e: React.FormEvent) => void;
}

export default function IoTBrokerCard({
  status,
  manualTopic,
  manualPayload,
  onTopicChange,
  onPayloadChange,
  onPublish
}: IoTBrokerCardProps) {
  return (
    <div className="glass-card integration-card">
      <div className="integration-card-header">
        <h3 className="integration-card-title">
          <Radio size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>IoT Device Telemetry Broker</span>
        </h3>
        <span className={`badge running integration-iot-badge`}>BROKER UP</span>
      </div>

      <div className="integration-stats-grid">
        <div className="integration-stat-box">
          <div className="integration-stat-label">Active MQTT Connections</div>
          <div className="integration-stat-value">{status?.iot.connections || 0} devices</div>
        </div>
        <div className="integration-stat-box">
          <div className="integration-stat-label">Messages Received</div>
          <div className="integration-stat-value">{status?.iot.messagesReceived || 0}</div>
        </div>
      </div>

      <div className="integration-iot-footer">
        <form onSubmit={onPublish} className="integration-publish-form">
          <span className="integration-publish-label">Test Publish Message Payload:</span>
          <div className="integration-publish-row">
            <input
              type="text"
              className="form-input integration-topic-input"
              placeholder="topic/subtopic"
              value={manualTopic}
              onChange={e => onTopicChange(e.target.value)}
              required
            />
            <input
              type="text"
              className="form-input integration-payload-input"
              placeholder='{"temp": 24}'
              value={manualPayload}
              onChange={e => onPayloadChange(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 12px' }} title="Publish Packet">
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
