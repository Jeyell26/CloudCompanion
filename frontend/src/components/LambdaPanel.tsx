import { useState, useEffect } from 'react';
import type { LambdaFunction } from '../types';
import { getLambdas, invokeLambda } from '../api';
import { Play, Activity, Code, Cpu, Terminal } from 'lucide-react';

export default function LambdaPanel() {
  const [lambdas, setLambdas] = useState<LambdaFunction[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [payload, setPayload] = useState('{\n  "action": "ping",\n  "debug": true\n}');
  const [isInvoking, setIsInvoking] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [responseOutput, setResponseOutput] = useState<string>('');

  useEffect(() => {
    async function fetchLambdas() {
      try {
        const data = await getLambdas();
        setLambdas(data);
        if (data.length > 0 && !selectedName) {
          setSelectedName(data[0].name);
        }
      } catch (err) {
        console.error('Failed to load Lambda functions', err);
      }
    }
    fetchLambdas();
  }, [selectedName]);

  const handleInvoke = async () => {
    if (!selectedName) return;
    setIsInvoking(true);
    setConsoleLogs([`[SYSTEM] Connecting to Lambda Endpoint /aws/lambda/${selectedName}...`]);
    setResponseOutput('');

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(payload);
    } catch (e) {
      setConsoleLogs(prev => [...prev, `[ERROR] Invalid JSON payload format.`]);
      setIsInvoking(false);
      return;
    }

    try {
      const res = await invokeLambda(selectedName, parsedPayload);
      setTimeout(() => {
        setConsoleLogs(prev => [...prev, `[SYSTEM] Execution response status: ${res.success ? '200 OK' : '500 ERROR'}`, ...res.logs.split('\n')]);
        setResponseOutput(JSON.stringify(res.payload, null, 2));
        setIsInvoking(false);
      }, 1000);
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, `[ERROR] Invocation failed: ${err.message}`]);
      setIsInvoking(false);
    }
  };

  const selectedLambda = lambdas.find(f => f.name === selectedName);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div className="card-title">
          <Activity size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Serverless Functions (AWS Lambda)</span>
        </div>
      </div>

      {/* Grid of Lambdas */}
      <div className="grid-cols-4">
        {lambdas.map(func => {
          const isSelected = selectedName === func.name;
          return (
            <div
              key={func.name}
              className="glass-card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--accent-purple)' : '',
                background: isSelected ? 'rgba(139, 92, 246, 0.05)' : ''
              }}
              onClick={() => setSelectedName(func.name)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>{func.name}</span>
                <span className="badge running" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                  {func.runtime}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Invocations:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{func.invocations}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Error Rate:</span>
                  <span style={{ fontWeight: 600, color: func.errors > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {((func.errors / (func.invocations || 1)) * 100).toFixed(2)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Avg Duration:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{func.duration} ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Sandbox Area */}
      {selectedLambda && (
        <div className="grid-cols-2">
          {/* Invoke Trigger Form */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Code size={16} />
                <span>Trigger Invoke Sandbox: {selectedLambda.name}</span>
              </h3>
            </div>

            <div className="form-group" style={{ flexGrow: 1 }}>
              <label className="form-label">Event Payload (JSON)</label>
              <textarea
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', height: '140px', resize: 'none' }}
                value={payload}
                onChange={e => setPayload(e.target.value)}
                disabled={isInvoking}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
              <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <span>Allocation: <b>{selectedLambda.memory} MB RAM</b></span>
                <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>|</span>
                <span>Type: <b>x86_64</b></span>
              </div>
            </div>

            <button
              onClick={handleInvoke}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '40px' }}
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

          {/* SRE Terminal Console Logger */}
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

            <div className="terminal-body" style={{ height: '320px', overflowY: 'auto' }}>
              {consoleLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '60px 0' }}>
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
                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                  <div style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '11px', marginBottom: '4px' }}>RESPONSE PAYLOAD:</div>
                  <pre style={{ margin: 0, padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', color: 'var(--accent-cyan)', fontSize: '11px', overflowX: 'auto' }}>
                    {responseOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
