import { useState, useEffect } from 'react';
import type { EC2Instance, LambdaFunction, IntegrationStatus } from '../../types';
import { getEC2Instances, getLambdas, getIntegrationStatus } from './api';
import DashboardMetrics from './components/DashboardMetrics';
import DashboardCpuGraph from './components/DashboardCpuGraph';
import DashboardTelemetry from './components/DashboardTelemetry';
import DashboardChecklist from './components/DashboardChecklist';
import './dashboard.css';

export default function Dashboard() {
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
    return () => { active = false; clearInterval(interval); };
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
  const lambdaInvocations = lambdas.reduce((sum, f) => sum + f.invocations, 0);

  return (
    < div className="dashboard-page" >
      {/* TODO: Remove this todo after all component todos have been finished */}
      <DashboardMetrics
        ec2RunningCount={runningCount}
        ec2TotalCount={ec2.length}
        lambdaCount={lambdas.length}
        lambdaInvocations={lambdaInvocations}
      />

      <div className="dashboard-grid-2">
        <DashboardCpuGraph cpuHistory={cpuHistory} />
        <DashboardTelemetry
          telemetry={telemetry}
          iotConnections={integrations?.iot.connections ?? 0}
        />
      </div>

      <DashboardChecklist rotationWarning={true} />
    </div >
  );
}
