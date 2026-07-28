import { useState } from 'react';
import { X, Settings as SettingsIcon, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { LogPulseSettings, NormalizationRule } from '../../types';
import './Settings.css';

interface SettingsProps {
  settings: LogPulseSettings;
  onUpdate: (updates: Partial<LogPulseSettings>) => void;
  onUpdateNormRule: (id: string, updates: Partial<NormalizationRule>) => void;
  onAddCustomRule: (rule: Omit<NormalizationRule, 'isBuiltIn'>) => void;
  onRemoveCustomRule: (id: string) => void;
  onClose: () => void;
}

export default function Settings({ settings, onUpdate, onUpdateNormRule, onAddCustomRule, onRemoveCustomRule, onClose }: SettingsProps) {
  const [normExpanded, setNormExpanded] = useState(false);
  const [newRuleLabel, setNewRuleLabel] = useState('');
  const [newRuleRegex, setNewRuleRegex] = useState('');
  const [newRuleReplacement, setNewRuleReplacement] = useState('');
  const [newRuleError, setNewRuleError] = useState<string | null>(null);

  const handleAddRule = () => {
    if (!newRuleLabel || !newRuleRegex || !newRuleReplacement) {
      setNewRuleError('All fields are required.');
      return;
    }
    try {
      new RegExp(newRuleRegex);
    } catch {
      setNewRuleError('Invalid regex pattern.');
      return;
    }
    setNewRuleError(null);
    onAddCustomRule({
      id: 'custom_' + Date.now(),
      label: newRuleLabel,
      regex: newRuleRegex,
      replacement: newRuleReplacement,
      enabled: true,
    });
    setNewRuleLabel('');
    setNewRuleRegex('');
    setNewRuleReplacement('');
  };

  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-drawer">
        <div className="settings-header">
          <div className="settings-header-title">
            <SettingsIcon size={18} />
            Settings
          </div>
          <button className="settings-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="settings-body">

          {/* Tracker Settings */}
          <section className="settings-section">
            <h3 className="settings-section-title">Tracker</h3>
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Most Common Limit</span>
                <span className="settings-row-desc">Max entries in the Most Common list</span>
              </div>
              <input
                type="number" min={1} max={100}
                value={settings.mostCommonLimit}
                onChange={e => onUpdate({ mostCommonLimit: Math.max(1, Math.min(100, Number(e.target.value))) })}
                className="settings-number-input"
              />
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">New Messages Limit</span>
                <span className="settings-row-desc">Max entries in the New Messages list</span>
              </div>
              <input
                type="number" min={1} max={100}
                value={settings.newMessagesLimit}
                onChange={e => onUpdate({ newMessagesLimit: Math.max(1, Math.min(100, Number(e.target.value))) })}
                className="settings-number-input"
              />
            </div>
          </section>

          {/* Range Query */}
          <section className="settings-section">
            <h3 className="settings-section-title">Range Query</h3>
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Default Time Window (hours)</span>
                <span className="settings-row-desc">Pre-filled window when opening range query</span>
              </div>
              <input
                type="number" min={1} max={24}
                value={settings.defaultTimeWindowHours}
                onChange={e => onUpdate({ defaultTimeWindowHours: Math.max(1, Math.min(24, Number(e.target.value))) })}
                className="settings-number-input"
              />
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Max Time Window (hours)</span>
                <span className="settings-row-desc">Hard cap — queries beyond this are rejected</span>
              </div>
              <input
                type="number" min={1} max={24}
                value={settings.maxTimeWindowHours}
                onChange={e => onUpdate({ maxTimeWindowHours: Math.max(1, Math.min(24, Number(e.target.value))) })}
                className="settings-number-input"
              />
            </div>
          </section>

          {/* Log Buffer */}
          <section className="settings-section">
            <h3 className="settings-section-title">Log Buffer</h3>
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Buffer Limit</span>
                <span className="settings-row-desc">Max log lines in memory (100–10,000)</span>
              </div>
              <input
                type="number" min={100} max={10000} step={100}
                value={settings.logBufferLimit}
                onChange={e => onUpdate({ logBufferLimit: Math.max(100, Math.min(10000, Number(e.target.value))) })}
                className="settings-number-input"
              />
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">When Buffer Is Full</span>
                <span className="settings-row-desc">Behavior when limit is reached</span>
              </div>
              <select
                value={settings.overflowBehavior}
                onChange={e => onUpdate({ overflowBehavior: e.target.value as LogPulseSettings['overflowBehavior'] })}
                className="settings-select"
              >
                <option value="ask">Ask</option>
                <option value="drop">Auto-drop oldest</option>
                <option value="download">Auto-download & drop</option>
              </select>
            </div>
          </section>

          {/* Filter Persistence */}
          <section className="settings-section">
            <h3 className="settings-section-title">Filters</h3>
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Restore filters on new session?</span>
                <span className="settings-row-desc">What to do with saved Focus/Ignore rules</span>
              </div>
              <select
                value={settings.filterPersistence}
                onChange={e => onUpdate({ filterPersistence: e.target.value as LogPulseSettings['filterPersistence'] })}
                className="settings-select"
              >
                <option value="ask">Ask each time</option>
                <option value="always">Always restore</option>
                <option value="never">Always reset</option>
              </select>
            </div>
          </section>

          {/* Normalization Rules */}
          <section className="settings-section">
            <button className="settings-section-toggle" onClick={() => setNormExpanded(v => !v)}>
              <h3 className="settings-section-title" style={{margin:0}}>Normalization Rules</h3>
              {normExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            {normExpanded && (
              <div className="settings-norm-content">
                <p className="settings-norm-desc">Strip variable parts of log messages before pattern matching. All rules are off by default.</p>
                {settings.normalizationRules.map(rule => (
                  <div key={rule.id} className="settings-norm-rule">
                    <div className="settings-norm-rule-info">
                      <span className="settings-norm-rule-label">{rule.label}</span>
                      {!rule.isBuiltIn && <span className="settings-norm-custom-badge">custom</span>}
                      <code className="settings-norm-rule-replacement">{rule.replacement}</code>
                    </div>
                    <div className="settings-norm-rule-actions">
                      <button
                        className={`settings-toggle-btn ${rule.enabled ? 'on' : 'off'}`}
                        onClick={() => onUpdateNormRule(rule.id, { enabled: !rule.enabled })}
                        title={rule.enabled ? 'Disable' : 'Enable'}
                      >
                        {rule.enabled ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                      </button>
                      {!rule.isBuiltIn && (
                        <button className="settings-remove-rule" onClick={() => onRemoveCustomRule(rule.id)}>
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="settings-norm-add">
                  <p className="settings-norm-add-title">Add Custom Rule</p>
                  {newRuleError && <p className="settings-norm-error">{newRuleError}</p>}
                  <div className="settings-norm-add-fields">
                    <input placeholder="Label" value={newRuleLabel} onChange={e=>setNewRuleLabel(e.target.value)} className="settings-norm-input" />
                    <input placeholder="Regex pattern" value={newRuleRegex} onChange={e=>setNewRuleRegex(e.target.value)} className="settings-norm-input font-mono" />
                    <input placeholder="Replacement (e.g. {custom})" value={newRuleReplacement} onChange={e=>setNewRuleReplacement(e.target.value)} className="settings-norm-input font-mono" />
                    <button className="btn btn-secondary btn-sm" onClick={handleAddRule}><Plus size={13}/> Add</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
