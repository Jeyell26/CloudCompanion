import { useState, useEffect } from 'react';
import type { LambdaFunction } from '../../types';
import { getLambdas, invokeLambda } from './api';
import { Activity } from 'lucide-react';
import LambdaList from './components/LambdaList';
import LambdaInvoke from './components/LambdaInvoke';
import LambdaLogs from './components/LambdaLogs';
import './lambda.css';

export default function Lambda() {
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
    <div className="lambda-container">
      <div className="card-header margin-bottom-0">
        <div className="card-title">
          <Activity size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Serverless Functions (AWS Lambda)</span>
        </div>
      </div>

      <LambdaList 
        lambdas={lambdas}
        selectedName={selectedName}
        onSelect={setSelectedName}
      />

      {selectedLambda && (
        <div className="lambda-sandbox-grid">
          <LambdaInvoke 
            functionName={selectedLambda.name}
            payload={payload}
            setPayload={setPayload}
            isInvoking={isInvoking}
            onInvoke={handleInvoke}
            memory={selectedLambda.memory}
          />
          <LambdaLogs 
            consoleLogs={consoleLogs}
            responseOutput={responseOutput}
          />
        </div>
      )}
    </div>
  );
}
