import { useState } from 'react';
import TopBar from '../components/TopBar';
import LogGroupSelector from '../features/log-groups/LogGroupSelector';
import LiveTail from '../features/live-tail/LiveTail';
import RangeQuery from '../features/range-query/RangeQuery';
import Settings from '../features/settings/Settings';
import { Radio, Calendar } from 'lucide-react';
import { useMock } from '../api/mockConfig';
import type { AuthSession, LogGroup, SessionMode } from '../types';
import type { useSettings } from '../features/settings/useSettings';
import './MainPage.css';

interface MainPageProps {
  session: AuthSession;
  settingsHook: ReturnType<typeof useSettings>;
  onLogout: () => void;
}

export default function MainPage({ session, settingsHook, onLogout }: MainPageProps) {
  const { settings, updateSettings, updateNormRule, addCustomNormRule, removeCustomNormRule } = settingsHook;
  const [selectedGroups, setSelectedGroups] = useState<LogGroup[]>([]);
  const [mode, setMode] = useState<SessionMode>('idle');
  const [showSettings, setShowSettings] = useState(false);

  const canStart = selectedGroups.length > 0;

  const handleStop = () => setMode('idle');

  return (
    <div className="main-page">
      <TopBar
        session={session}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={onLogout}
        backendConnected={!useMock()}
      />

      {mode === 'idle' && (
        <div className="main-selector">
          <div className="main-selector-inner">
            <div className="main-selector-heading">
              <h2>Select Log Groups</h2>
              <p>Choose one or more CloudWatch log groups to begin monitoring.</p>
            </div>

            <LogGroupSelector
              selected={selectedGroups}
              onChange={setSelectedGroups}
            />

            <div className={`main-mode-buttons ${!canStart ? 'disabled' : ''}`}>
              <button
                className="mode-btn live-btn"
                disabled={!canStart}
                onClick={() => setMode('live-tail')}
              >
                <div className="mode-btn-icon">
                  <Radio size={22} />
                </div>
                <div className="mode-btn-text">
                  <span className="mode-btn-title">Start Live Tail</span>
                  <span className="mode-btn-desc">Stream logs in real-time as they arrive</span>
                </div>
              </button>

              <button
                className="mode-btn range-btn"
                disabled={!canStart}
                onClick={() => setMode('range-query')}
              >
                <div className="mode-btn-icon">
                  <Calendar size={22} />
                </div>
                <div className="mode-btn-text">
                  <span className="mode-btn-title">Date/Time Range</span>
                  <span className="mode-btn-desc">Query logs within a specific time window</span>
                </div>
              </button>
            </div>

            {!canStart && (
              <p className="main-select-hint">Select at least one log group to continue.</p>
            )}
          </div>
        </div>
      )}

      {mode === 'live-tail' && (
        <LiveTail
          selectedGroups={selectedGroups}
          settings={settings}
          onStop={handleStop}
        />
      )}

      {mode === 'range-query' && (
        <RangeQuery
          selectedGroups={selectedGroups}
          settings={settings}
          onBack={handleStop}
        />
      )}

      {showSettings && (
        <Settings
          settings={settings}
          onUpdate={updateSettings}
          onUpdateNormRule={updateNormRule}
          onAddCustomRule={addCustomNormRule}
          onRemoveCustomRule={removeCustomNormRule}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
