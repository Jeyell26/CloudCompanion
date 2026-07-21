import { Code, Cpu, Play } from 'lucide-react';
import './lambda.css';

interface LambdaInvokeProps {
  functionName: string;
  payload: string;
  setPayload: (payload: string) => void;
  isInvoking: boolean;
  onInvoke: () => void;
  memory: number;
}

export default function LambdaInvoke({
  functionName,
  payload,
  setPayload,
  isInvoking,
  onInvoke,
  memory
}: LambdaInvokeProps) {
  return (
    <div className="glass-card lambda-form-card">
      <div className="lambda-form-header">
        <h3 className="lambda-form-title">
          <Code size={16} />
          <span>Trigger Invoke Sandbox: {functionName}</span>
        </h3>
      </div>

      <div className="form-group" style={{ flexGrow: 1 }}>
        <label className="form-label">Event Payload (JSON)</label>
        <textarea
          className="form-input lambda-payload-input"
          value={payload}
          onChange={e => setPayload(e.target.value)}
          disabled={isInvoking}
        />
      </div>

      <div className="lambda-meta-box">
        <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
        <div>
          <span>Allocation: <b>{memory} MB RAM</b></span>
          <span className="lambda-meta-separator">|</span>
          <span>Type: <b>x86_64</b></span>
        </div>
      </div>

      <button
        onClick={onInvoke}
        className="btn btn-primary lambda-btn-primary"
        disabled={isInvoking}
      >
        {isInvoking ? (
          <>
            <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
            <span>Invoking...</span>
          </>
        ) : (
          <>
            <Play size={14} fill="currentColor" />
            <span>Execute Function</span>
          </>
        )}
      </button>
    </div>
  );
}
