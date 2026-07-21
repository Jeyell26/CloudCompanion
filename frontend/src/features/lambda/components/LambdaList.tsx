import type { LambdaFunction } from '../../../types';
import '../lambda.css';

interface LambdaListProps {
  lambdas: LambdaFunction[];
  selectedName: string | null;
  onSelect: (name: string) => void;
}

export default function LambdaList({
  lambdas,
  selectedName,
  onSelect
}: LambdaListProps) {
  return (
    <div className="lambda-grid">
      {lambdas.map(func => {
        const isSelected = selectedName === func.name;
        const errorRate = (func.errors / (func.invocations || 1)) * 100;
        return (
          <div
            key={func.name}
            className={`glass-card lambda-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(func.name)}
          >
            <div className="lambda-card-header">
              <span className="lambda-card-title">{func.name}</span>
              <span className="badge running lambda-card-badge">
                {func.runtime}
              </span>
            </div>
            <div className="lambda-card-details">
              <div className="lambda-detail-row">
                <span>Invocations:</span>
                <span className="lambda-detail-value">{func.invocations}</span>
              </div>
              <div className="lambda-detail-row">
                <span>Error Rate:</span>
                <span className={`lambda-detail-value ${func.errors > 0 ? 'danger' : 'success'}`}>
                  {errorRate.toFixed(2)}%
                </span>
              </div>
              <div className="lambda-detail-row">
                <span>Avg Duration:</span>
                <span className="lambda-detail-value">{func.duration} ms</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
