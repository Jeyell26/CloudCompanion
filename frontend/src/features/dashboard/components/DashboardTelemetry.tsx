import { Wifi } from 'lucide-react';
import '../dashboard.css';

interface DashboardTelemetryProps {
  telemetry: any[];
  iotConnections: number;
}

export default function DashboardTelemetry({ telemetry, iotConnections }: DashboardTelemetryProps) {
  return (
    <div className="glass-card dashboard-telemetry-container">
      <div className="card-header">
        <div className="card-title">
          <Wifi size={18} style={{ color: 'var(--accent-cyan)' }} />
          <span>IoT Core MQTT Telemetry Stream</span>
        </div>
        <div className="backend-status-badge connected dashboard-telemetry-status-badge">
          <span className="status-dot pulse" />
          <span>Broker Live ({iotConnections} active)</span>
        </div>
      </div>

      <div className="dashboard-telemetry-stream-body">
        {telemetry.length === 0 ? (
          <div className="dashboard-telemetry-empty">
            Waiting for telemetry broker packets...
          </div>
        ) : (
          telemetry.map((msg, index) => (
            <div key={index} className="telemetry-message dashboard-telemetry-msg-row">
              <div className="dashboard-telemetry-msg-info">
                <span className="dashboard-telemetry-msg-time">[{msg.timestamp}]</span>
                <span className="dashboard-telemetry-msg-device">{msg.device}</span>
                <span className="dashboard-telemetry-msg-arrow">→</span>
                <code className="dashboard-telemetry-msg-payload">
                  {JSON.stringify(msg.payload)}
                </code>
              </div>
              <span className="badge running dashboard-telemetry-msg-badge">MQTT</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
