import { Cpu } from 'lucide-react';
import './dashboard.css';

interface DashboardCpuGraphProps {
  cpuHistory: number[];
}

export default function DashboardCpuGraph({ cpuHistory }: DashboardCpuGraphProps) {
  const maxCpu = 100;
  const points = cpuHistory.map((val, index) => {
    const x = (index / (cpuHistory.length - 1)) * 300;
    const y = 100 - (val / maxCpu) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="glass-card">
      <div className="card-header">
        <div className="card-title">
          <Cpu size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Average Fleet CPU Utilization (%)</span>
        </div>
        <span className="badge running">LIVE FEED</span>
      </div>

      <div className="dashboard-cpu-svg-container">
        <svg viewBox="0 0 300 100" className="dashboard-cpu-svg">
          <defs>
            <linearGradient id="cpuGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="20" x2="300" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="0" y1="50" x2="300" y2="50" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="0" y1="80" x2="300" y2="80" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />

          <path
            d={`M 0,100 L ${points} L 300,100 Z`}
            fill="url(#cpuGlow)"
          />
          <polyline
            fill="none"
            stroke="var(--accent-purple)"
            strokeWidth="2"
            points={points}
          />
        </svg>
        <div className="dashboard-cpu-footer">
          <span>60s ago</span>
          <span>Average CPU: {cpuHistory[cpuHistory.length - 1]}%</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}
