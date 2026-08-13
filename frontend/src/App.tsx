import { useState } from 'react';
import Login from './features/auth/Login';
import MainPage from './pages/MainPage';
import { getStoredSession, logout } from './features/auth/api/login';
import type { AuthSession } from './types';
import { useSettings } from './features/settings/useSettings';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const settingsHook = useSettings();

  const handleLogout = () => {
    logout();
    setSession(null);
  };

  if (!session) {
    return <Login onSuccess={setSession} />;
  }

  return (
    <MainPage
      session={session}
      settingsHook={settingsHook}
      onLogout={handleLogout}
    />
  );
}
