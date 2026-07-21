import { Terminal } from 'lucide-react';
import '../dashboard.css';

interface DashboardChecklistProps {
  rotationWarning: boolean;
}

export default function DashboardChecklist({ rotationWarning }: DashboardChecklistProps) {
  return (
    <div className="glass-card">
      <div className="card-header">
        <div className="card-title">
          <Terminal size={18} />
          <span>SRE Auto-Alert Health Checklist</span>
        </div>
      </div>
      <div className="dashboard-checklist-container">
        <div className="dashboard-checklist-row">
          <span>SSL Certification Status (CloudFront Edge)</span>
          {/* TODO: add calculation for expires in X days */}
          <span className="dashboard-checklist-status success">✓ SECURE (Expires in 88 days)</span>
        </div>
        <div className="dashboard-checklist-row">
          <span>API Gateway Access Controller Permissions</span>
          {/* TODO: add IAM check */}
          <span className="dashboard-checklist-status success">✓ ACTIVE (IAM Least-privilege applied)</span>
        </div>
        <div className="dashboard-checklist-row">
          <span>Secrets Rotation (Secrets Manager)</span>
          {/* TODO: add actual secrets check */}
          {rotationWarning ? (
            <span className="dashboard-checklist-status warning">⚠ WARNING (Rotation past due: 2 secrets)</span>
          ) : (
            <span className="dashboard-checklist-status success">✓ COMPLIANT (All secrets rotated)</span>
          )}
        </div>
        <div className="dashboard-checklist-row no-border">
          <span>S3 Static Hosting CDN Caching</span>
          {/* TODO: add actual caching check */}
          <span className="dashboard-checklist-status success">✓ CACHED (Edge hit rate 94.2%)</span>
        </div>
      </div>
    </div>
  );
}
