import { LayoutDashboard, Server, Activity, Terminal, HardDrive, Layers, Shield, ChevronLeft } from 'lucide-react';
import { NavLink, type NavLinkRenderProps } from 'react-router-dom';
import './navbar.css';

interface NavbarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

function Navbar({ isCollapsed, toggleSidebar }: NavbarProps): any {
  const getTabClass = ({ isActive }: NavLinkRenderProps) => {
    return isActive ? 'nav-item active' : 'nav-item';
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div 
        className="sidebar-header" 
        onClick={() => isCollapsed && toggleSidebar()}
        title={isCollapsed ? "Expand Sidebar" : undefined}
      >
        <div className="sidebar-brand-section">
          <div className="logo-glow">☁️</div>
          {!isCollapsed && <span className="brand-name">AWS Companion</span>}
        </div>
        {!isCollapsed && (
          <button 
            onClick={(e) => {
              e.stopPropagation(); // prevent header click from expanding
              toggleSidebar();
            }} 
            className="collapse-btn"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/overview" className={getTabClass} title={isCollapsed ? "Dashboard" : undefined}>
          <LayoutDashboard size={18} />
          {!isCollapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/ec2" className={getTabClass} title={isCollapsed ? "EC2 Instances" : undefined}>
          <Server size={18} />
          {!isCollapsed && <span>EC2 Instances</span>}
        </NavLink>

        <NavLink to="/lambda" className={getTabClass} title={isCollapsed ? "Lambda Functions" : undefined}>
          <Activity size={18} />
          {!isCollapsed && <span>Lambda Functions</span>}
        </NavLink>

        <NavLink to="/cloudwatch" className={getTabClass} title={isCollapsed ? "CloudWatch Logs" : undefined}>
          <Terminal size={18} />
          {!isCollapsed && <span>CloudWatch Logs</span>}
        </NavLink>

        <NavLink to="/s3" className={getTabClass} title={isCollapsed ? "S3 Buckets" : undefined}>
          <HardDrive size={18} />
          {!isCollapsed && <span>S3 Buckets</span>}
        </NavLink>

        <NavLink to="/integrations" className={getTabClass} title={isCollapsed ? "Integrations" : undefined}>
          <Layers size={18} />
          {!isCollapsed && <span>Integrations</span>}
        </NavLink>

        <NavLink to="/secrets" className={getTabClass} title={isCollapsed ? "Secrets Manager" : undefined}>
          <Shield size={18} />
          {!isCollapsed && <span>Secrets Manager</span>}
        </NavLink>
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar-circle">JE</div>
            <div className="user-info">
              <span className="username-text">Jeyell</span>
              <span className="email-text">demo@example.com</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Navbar;
