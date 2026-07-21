import type { IntegrationStatus } from '../../types';
import { Globe } from 'lucide-react';
import './integrations.css';

interface ApiGatewayCardProps {
  status: IntegrationStatus | null;
}

export default function ApiGatewayCard({ status }: ApiGatewayCardProps) {
  return (
    <div className="glass-card integration-card">
      <div className="integration-card-header">
        <h3 className="integration-card-title">
          <Globe size={16} style={{ color: 'var(--accent-purple)' }} />
          <span>API Gateway Router: /api/*</span>
        </h3>
        <span className="badge running">API ACTIVE</span>
      </div>

      <div className="integration-stats-grid">
        <div className="integration-stat-box">
          <div className="integration-stat-label">Total API Requests</div>
          <div className="integration-stat-value">{status?.apiGateway.requestCount || 0}</div>
        </div>
        <div className="integration-stat-box">
          <div className="integration-stat-label">Average Error Rate</div>
          <div className="integration-stat-value success">
            {status?.apiGateway.errorRate.toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="integration-routes-label">Active Mapping Routes:</span>
        <div className="integration-routes-list">
          {status?.apiGateway.routes.map(r => (
            <div key={r} className="integration-route-row">
              <span className="integration-route-path">{r}</span>
              <span className="integration-route-type">INTEGRATION: LAMBDA</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
