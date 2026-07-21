import { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import './integrations.css';

interface MqttTerminalProps {
  mqttLogs: string[];
}

export default function MqttTerminal({ mqttLogs }: MqttTerminalProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mqttLogs]);

  return (
    <div className="terminal-window">
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

      <div className="terminal-body integration-terminal-body">
        {mqttLogs.length === 0 ? (
          <div className="integration-terminal-empty">
            Initializing telemetry subscriptions. Listening for MQTT packet transmissions...
          </div>
        ) : (
          mqttLogs.map((log, idx) => {
            let lineClass = `terminal-line integration-terminal-log-line`;
            if (log.includes('[PUB]')) lineClass += ' info';
            if (log.includes('[SUB]')) lineClass += ' system';
            return <div key={idx} className={lineClass}>{log}</div>;
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
