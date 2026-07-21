import type { EC2Instance } from '../../../types';
import { Cpu } from 'lucide-react';
import '../ec2.css';

interface EC2InspectorProps {
  selectedInstance: EC2Instance | undefined;
}

export default function EC2Inspector({ selectedInstance }: EC2InspectorProps) {
  if (!selectedInstance) return null;

  return (
    <div className="glass-card ec2-inspector-card">
      <div className="ec2-inspector-header">
        <h3 className="ec2-inspector-title">Instance Inspector</h3>
        <p className="ec2-inspector-subtitle">Resource configuration & metrics</p>
      </div>

      <div className="ec2-inspector-details-list">
        <div className="ec2-inspector-row">
          <span className="ec2-inspector-label">Resource Name:</span>
          <span className="ec2-inspector-value">{selectedInstance.name}</span>
        </div>
        <div className="ec2-inspector-row">
          <span className="ec2-inspector-label">Instance ID:</span>
          <code className="ec2-inspector-value-code">{selectedInstance.id}</code>
        </div>
        <div className="ec2-inspector-row">
          <span className="ec2-inspector-label">Instance State:</span>
          <span className={`badge ${selectedInstance.status}`}>
            {selectedInstance.status.toUpperCase()}
          </span>
        </div>
        <div className="ec2-inspector-row">
          <span className="ec2-inspector-label">Compute Type:</span>
          <code>{selectedInstance.type}</code>
        </div>
        <div className="ec2-inspector-row">
          <span className="ec2-inspector-label">Elastic Public IP:</span>
          <span>{selectedInstance.ip || 'None'}</span>
        </div>
        {selectedInstance.status === 'running' && (
          <div className="ec2-inspector-row">
            <span className="ec2-inspector-label">CPU Threads:</span>
            <span>
              {selectedInstance.type.includes('xlarge') 
                ? '4 vCPUs' 
                : selectedInstance.type.includes('large') 
                  ? '2 vCPUs' 
                  : '1 vCPU'}
            </span>
          </div>
        )}
      </div>

      <div className="ec2-inspector-billing-box">
        <Cpu size={24} style={{ color: 'var(--accent-purple)' }} />
        <div>
          <p className="ec2-inspector-subtitle">Hourly Cost Billing</p>
          <p className="ec2-inspector-billing-cost">
            {selectedInstance.status === 'running'
              ? `$${(selectedInstance.type.includes('xlarge') ? 0.16 : selectedInstance.type.includes('large') ? 0.08 : 0.02).toFixed(2)}/hour`
              : '$0.00/hour (Suspended)'}
          </p>
        </div>
      </div>
    </div>
  );
}
