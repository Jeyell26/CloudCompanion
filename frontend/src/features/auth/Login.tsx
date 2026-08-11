import { useState } from 'react';
import { Key, Globe, Zap, AlertCircle, ChevronRight } from 'lucide-react';
import { loginWithIAM } from './api/login';
import type { AuthSession } from '../../types';
import './Login.css';

interface LoginProps {
  onSuccess: (session: AuthSession) => void;
}

const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'sa-east-1',
];

export default function Login({ onSuccess }: LoginProps) {
  const [roleArn, setRoleArn] = useState('');
  const [externalId, setExternalId] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleArn.trim()) {
      setError('IAM Role ARN is required.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const session = await loginWithIAM({
        roleArn: roleArn.trim(),
        externalId: externalId.trim() || undefined,
        region,
      });
      onSuccess(session);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillLocalstack = () => {
    setRoleArn('arn:aws:iam::123456789012:role/LogPulseReadRole');
    setExternalId('logpulse-secure-external-id');
    setRegion('us-east-1');
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-glow-orb orb-1" />
      <div className="login-glow-orb orb-2" />

      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <Zap size={22} />
          </div>
          <div>
            <h1 className="login-title">LogPulse</h1>
            <p className="login-subtitle">AWS CloudWatch Intelligence</p>
          </div>
        </div>

        <div className="login-divider" />

        <p className="login-desc">
          Connect your AWS Account securely via Cross-Account IAM Role Assumption (<code>sts:AssumeRole</code>). Zero static keys required.
        </p>

        {error && (
          <div className="login-error">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="role-arn">IAM Role ARN</label>
            <div className="login-input-wrap">
              <Key size={15} className="login-input-icon" />
              <input
                id="role-arn"
                type="text"
                placeholder="arn:aws:iam::123456789012:role/LogPulseReadRole"
                value={roleArn}
                onChange={e => setRoleArn(e.target.value)}
                className="login-input"
                disabled={isLoading}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="external-id">External ID (Optional)</label>
            <div className="login-input-wrap">
              <Key size={15} className="login-input-icon" />
              <input
                id="external-id"
                type="text"
                placeholder="logpulse-secure-external-id"
                value={externalId}
                onChange={e => setExternalId(e.target.value)}
                className="login-input"
                disabled={isLoading}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="region">
              <Globe size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Region
            </label>
            <select
              id="region"
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="login-input login-select"
              disabled={isLoading}
            >
              {AWS_REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="login-submit" disabled={isLoading}>
            {isLoading ? (
              <><span className="login-spinner" /> Authenticating...</>
            ) : (
              <>Connect to CloudWatch <ChevronRight size={16} /></>
            )}
          </button>
        </form>

        <div className="login-localstack">
          <span>Running LocalStack / Mock?</span>
          <button type="button" onClick={fillLocalstack} className="login-localstack-btn">
            Fill Mock Role ARN
          </button>
        </div>
      </div>
    </div>
  );
}
