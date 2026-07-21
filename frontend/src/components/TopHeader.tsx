import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface TopHeaderProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
}

function TopHeader({ onMenuClick, showMenuButton }: TopHeaderProps) {
  const location = useLocation();

  const getHeaderTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/overview':
        return 'Command Center Overview';
      case '/ec2':
        return 'EC2 Compute Engine Manager';
      case '/lambda':
        return 'AWS Lambda Core Functions';
      case '/cloudwatch':
        return 'CloudWatch Logs & Diagnostics';
      case '/s3':
        return 'Simple Storage Service (S3)';
      case '/integrations':
        return 'API Gateway & MQTT Connection Broker';
      case '/secrets':
        return 'KMS Secrets Manager Portal';
      default:
        return 'AWS Companion Dashboard';
    }
  };

  return (
    <header className="top-header">
      <div className="header-title-section">
        {showMenuButton && (
          <button 
            onClick={onMenuClick} 
            className="toggle-sidebar-btn"
            title="Expand Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="view-heading">{getHeaderTitle()}</h1>
      </div>
      
      <div className="backend-status-badge simulator">
        <span className="status-dot" style={{ backgroundColor: 'var(--color-success)' }} />
        <span>Simulator Sandbox</span>
      </div>
    </header>
  );
}

export default TopHeader;
