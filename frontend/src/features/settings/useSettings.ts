import { useState, useCallback } from 'react';
import type { LogPulseSettings, NormalizationRule } from '../../types';
import { DEFAULT_SETTINGS } from '../../types';

const SETTINGS_KEY = 'logpulse_settings';

function loadSettings(): LogPulseSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<LogPulseSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      normalizationRules: parsed.normalizationRules ?? DEFAULT_SETTINGS.normalizationRules,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: LogPulseSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function useSettings() {
  const [settings, setSettings] = useState<LogPulseSettings>(loadSettings);

  const updateSettings = useCallback((updates: Partial<LogPulseSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateNormRule = useCallback((id: string, updates: Partial<NormalizationRule>) => {
    setSettings(prev => {
      const next = {
        ...prev,
        normalizationRules: prev.normalizationRules.map(r =>
          r.id === id ? { ...r, ...updates } : r
        ),
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const addCustomNormRule = useCallback((rule: Omit<NormalizationRule, 'isBuiltIn'>) => {
    setSettings(prev => {
      const next = {
        ...prev,
        normalizationRules: [...prev.normalizationRules, { ...rule, isBuiltIn: false }],
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const removeCustomNormRule = useCallback((id: string) => {
    setSettings(prev => {
      const next = {
        ...prev,
        normalizationRules: prev.normalizationRules.filter(r => r.id !== id),
      };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings, updateNormRule, addCustomNormRule, removeCustomNormRule };
}
