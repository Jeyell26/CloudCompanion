import { Server, Activity, ShieldAlert, DollarSign } from 'lucide-react';
import './dashboard.css';

interface DashboardMetricsProps {
  ec2RunningCount: number;
  ec2TotalCount: number;
  lambdaCount: number;
  lambdaInvocations: number;
}

export default function DashboardMetrics({
  ec2RunningCount,
  ec2TotalCount,
  lambdaCount,
  lambdaInvocations
}: DashboardMetricsProps) {
  return (
    <div className="dashboard-grid-4">
      <div className="glass-card metric-card">
        <div className="metric-content">
          <span className="metric-label">EC2 Instances</span>
          <span className="metric-value">
            {ec2RunningCount}{' '}
            <span className="dashboard-metric-muted-label">/ {ec2TotalCount}</span>
          </span>
          <div className="metric-trend" style={{ color: 'var(--color-success)' }}>
            <Server size={12} />
            <span>{ec2RunningCount} active servers</span>
          </div>
        </div>
        <div className="metric-icon-box purple">
          <Server size={22} />
        </div>
      </div>

      <div className="glass-card metric-card">
        <div className="metric-content">
          <span className="metric-label">Lambda Functions</span>
          <span className="metric-value">{lambdaCount}</span>
          <div className="metric-trend" style={{ color: 'var(--accent-cyan)' }}>
            <Activity size={12} />
            <span>{lambdaInvocations} total invokes</span>
          </div>
        </div>
        <div className="metric-icon-box cyan">
          <Activity size={22} />
        </div>
      </div>

      <div className="glass-card metric-card">
        <div className="metric-content">
          <span className="metric-label">Active Alarm State</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>0</span>
          <div className="metric-trend" style={{ color: 'var(--color-success)' }}>
            <ShieldAlert size={12} />
            <span>System status healthy</span>
          </div>
        </div>
        <div className="metric-icon-box success">
          <ShieldAlert size={22} />
        </div>
      </div>

      <div className="glass-card metric-card">
        <div className="metric-content">
          <span className="metric-label">Proj. AWS Bill</span>
          {/* TODO: Add calculation for estimated value. */}
          <span className="metric-value">$0.12</span>
          <div className="metric-trend" style={{ color: 'var(--color-success)' }}>
            <DollarSign size={12} />
            <span>Free-tier compliant</span>
          </div>
        </div>
        <div className="metric-icon-box warning">
          <DollarSign size={22} />
        </div>
      </div>
    </div>
  );
}
