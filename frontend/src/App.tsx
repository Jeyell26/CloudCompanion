import { useState, useEffect } from 'react';
import type { User } from './types';
import { getProfile, registerBackendStatusListener } from './api';
import Login from './components/Login';
import DashboardOverview from './components/DashboardOverview';
import EC2Panel from './components/EC2Panel';
import LambdaPanel from './components/LambdaPanel';
import CloudWatchPanel from './components/CloudWatchPanel';
import S3Panel from './components/S3Panel';
import IntegrationsPanel from './components/IntegrationsPanel';
import SecretsPanel from './components/SecretsPanel';
import {
  LayoutDashboard,
  Server,
  Activity,
  Terminal,
  HardDrive,
  Layers,
  Shield,
  LogOut,
  AlertTriangle,
  Loader2
} from 'lucide-react';

type Tab = 'overview' | 'ec2' | 'lambda' | 'cloudwatch' | 's3' | 'integrations' | 'secrets';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [showSimulatorToast, setShowSimulatorToast] = useState(false);

  // Authenticate user on load
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const profile = await getProfile();
          setUser(profile);
        } catch (e) {
          console.warn('Cached session validation failed. Resetting.');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setIsCheckingAuth(false);
    }
    checkAuth();
  }, []);

  // Monitor API Connection status to display live/simulator pill
  useEffect(() => {
    registerBackendStatusListener((connected) => {
      setIsBackendConnected(connected);
      if (!connected) {
        setShowSimulatorToast(true);
        // Hide toast after 5 seconds
        const timer = setTimeout(() => setShowSimulatorToast(false), 5000);
        return () => clearTimeout(timer);
      } else {
        setShowSimulatorToast(false);
      }
    });
  }, [user]);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setActiveTab('overview');
  };

  if (isCheckingAuth) {
    return (
      <div className="loading-overlay" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="spinner" size={32} />
        <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Authorizing SRE session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login onAuthSuccess={handleAuthSuccess} />;
  }

  // Render components based on selected tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'ec2':
        return <EC2Panel />;
      case 'lambda':
        return <LambdaPanel />;
      case 'cloudwatch':
        return <CloudWatchPanel />;
      case 's3':
        return <S3Panel />;
      case 'integrations':
        return <IntegrationsPanel />;
      case 'secrets':
        return <SecretsPanel />;
      default:
        return <DashboardOverview />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Command Center Overview';
      case 'ec2': return 'EC2 Compute Engine Manager';
      case 'lambda': return 'AWS Lambda Core Functions';
      case 'cloudwatch': return 'CloudWatch Logs & Diagnostics';
      case 's3': return 'Simple Storage Service (S3)';
      case 'integrations': return 'API Gateway & MQTT Connection Broker';
      case 'secrets': return 'KMS Secrets Manager Portal';
      default: return 'AWS Companion Dashboard';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-glow">☁️</div>
          <span className="brand-name">AWS Companion</span>
        </div>

        <nav className="sidebar-menu">
          <div
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'ec2' ? 'active' : ''}`}
            onClick={() => setActiveTab('ec2')}
          >
            <Server size={18} />
            <span>EC2 Instances</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'lambda' ? 'active' : ''}`}
            onClick={() => setActiveTab('lambda')}
          >
            <Activity size={18} />
            <span>Lambda Functions</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'cloudwatch' ? 'active' : ''}`}
            onClick={() => setActiveTab('cloudwatch')}
          >
            <Terminal size={18} />
            <span>CloudWatch Logs</span>
          </div>

          <div
            className={`nav-item ${activeTab === 's3' ? 'active' : ''}`}
            onClick={() => setActiveTab('s3')}
          >
            <HardDrive size={18} />
            <span>S3 Buckets</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            <Layers size={18} />
            <span>Integrations</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'secrets' ? 'active' : ''}`}
            onClick={() => setActiveTab('secrets')}
          >
            <Shield size={18} />
            <span>Secrets Manager</span>
          </div>
        </nav>

        {/* User profile footer */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar-circle">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="username-text">{user.username}</span>
              <span className="email-text">{user.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title-section">
            <h1 className="view-heading">{getHeaderTitle()}</h1>
          </div>

          <div>
            {isBackendConnected ? (
              <div className="backend-status-badge connected">
                <span className="status-dot pulse" />
                <span>AWS Live Gateway</span>
              </div>
            ) : (
              <div
                className="backend-status-badge simulator"
                title="Express server on port 5000 is unreachable. Using offline state simulation."
              >
                <span className="status-dot" style={{ backgroundColor: 'var(--color-warning)' }} />
                <span>Simulator Sandbox</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="content-body">
          {renderContent()}
        </div>
      </main>

      {/* Toast Alert popup for offline simulation */}
      {showSimulatorToast && (
        <div className="toast-notification">
          <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
          <div>
            <p style={{ fontWeight: 600 }}>API Gateway Unreachable</p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Express server is offline. Running application in simulated sandbox.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
