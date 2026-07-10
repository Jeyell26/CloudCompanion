import { useState } from 'react';
import { loginUser, registerUser } from '../api';
import type { User } from '../types';
import { Lock, Mail, User as UserIcon, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onAuthSuccess: (user: User) => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!username) throw new Error('Username is required');
        const res = await registerUser(username, email, password);
        onAuthSuccess(res.user);
      } else {
        const res = await loginUser(email, password);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-card">
        <div className="auth-header">
          <div className="auth-logo">☁️</div>
          <h2 className="auth-title">AWS Companion</h2>
          <p className="auth-subtitle">
            {isRegister ? 'Create your administrator profile' : 'Sign in to access DevOps Console'}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }} />
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="admin_jeyell"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="demo@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Security Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px', height: '42px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing Access...' : isRegister ? 'Register & Initialize' : 'Authenticate Credentials'}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <span className="auth-link" onClick={() => setIsRegister(false)}>
                Sign in
              </span>
            </>
          ) : (
            <>
              New SRE Administrator?{' '}
              <span className="auth-link" onClick={() => setIsRegister(true)}>
                Register here
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
