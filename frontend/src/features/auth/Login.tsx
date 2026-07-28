import { useState } from 'react';
import { Eye, EyeOff, Key, Globe, Zap, AlertCircle, ChevronRight } from 'lucide-react';
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
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKeyId.trim() || !secretKey.trim()) {
      setError('Access Key ID and Secret Access Key are required.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const session = await loginWithIAM({ accessKeyId: accessKeyId.trim(), secretAccessKey: secretKey.trim(), region });
      onSuccess(session);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillLocalstack = () => {
    setAccessKeyId('localstack');
    setSecretKey('localstack');
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
          Enter your AWS IAM credentials to connect. Credentials are held in memory only and never persisted.
        </p>

        {error && (
          <div className="login-error">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="access-key">Access Key ID</label>
            <div className="login-input-wrap">
              <Key size={15} className="login-input-icon" />
              <input
                id="access-key"
                type="text"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={accessKeyId}
                onChange={e => setAccessKeyId(e.target.value)}
                className="login-input"
                disabled={isLoading}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="secret-key">Secret Access Key</label>
            <div className="login-input-wrap">
              <Key size={15} className="login-input-icon" />
              <input
                id="secret-key"
                type={showSecret ? 'text' : 'password'}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                value={secretKey}
                onChange={e => setSecretKey(e.target.value)}
                className="login-input has-suffix"
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="button"
                className="login-toggle-secret"
                onClick={() => setShowSecret(v => !v)}
                tabIndex={-1}
              >
                {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
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
          <span>Running LocalStack?</span>
          <button type="button" onClick={fillLocalstack} className="login-localstack-btn">
            Fill LocalStack credentials
          </button>
        </div>
      </div>
    </div>
  );
}
