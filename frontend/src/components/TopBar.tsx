import { Settings as SettingsIcon, LogOut, Zap, Wifi, WifiOff } from 'lucide-react';
import type { AuthSession } from '../types';
import './TopBar.css';

interface TopBarProps {
  session: AuthSession;
  onOpenSettings: () => void;
  onLogout: () => void;
  backendConnected?: boolean;
}

export default function TopBar({ session, onOpenSettings, onLogout, backendConnected = false }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo">
          <Zap size={16} />
        </div>
        <span className="topbar-name">LogPulse</span>
      </div>

      <div className="topbar-right">
        <div className={`topbar-status ${backendConnected ? 'connected' : 'local'}`}>
          {backendConnected ? <Wifi size={12}/> : <WifiOff size={12}/>}
          <span>{backendConnected ? `${session.region}` : 'LocalStack / Mock'}</span>
        </div>

        <span className="topbar-key-hint">{session.roleArn.split('/').pop() || session.roleArn}</span>

        <button className="topbar-btn settings-btn" onClick={onOpenSettings} title="Settings">
          <SettingsIcon size={16} />
          <span>Settings</span>
        </button>

        <button className="topbar-btn logout-btn" onClick={onLogout} title="Logout">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
