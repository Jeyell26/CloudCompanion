import { Terminal } from 'lucide-react';
import './lambda.css';

interface LambdaLogsProps {
  consoleLogs: string[];
  responseOutput: string;
}

export default function LambdaLogs({ consoleLogs, responseOutput }: LambdaLogsProps) {
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
          <span>lambda-executor-logs.sh</span>
        </div>
      </div>

      <div className="terminal-body lambda-terminal-body">
        {consoleLogs.length === 0 ? (
          <div className="lambda-terminal-placeholder">
            $ Ready to run. Trigger execute to monitor CloudWatch log groups in real-time.
          </div>
        ) : (
          consoleLogs.map((line, idx) => {
            let lineClass = 'terminal-line';
            if (line.includes('[ERROR]')) lineClass += ' error';
            if (line.includes('[SYSTEM]')) lineClass += ' system';
            if (line.includes('START') || line.includes('REPORT') || line.includes('END')) lineClass += ' info';
            return (
              <div key={idx} className={lineClass}>
                {line}
              </div>
            );
          })
        )}
        {responseOutput && (
          <div className="lambda-response-section">
            <div className="lambda-response-title">RESPONSE PAYLOAD:</div>
            <pre className="lambda-response-payload">
              {responseOutput}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
