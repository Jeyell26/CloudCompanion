import type { FilterRule, FilterMode } from '../../types';
import { getFocusColor } from '../trackers/trackerEngine';

export function addOrUpdateFilter(
  rules: FilterRule[],
  pattern: string,
  mode: FilterMode,
  logIndices?: number[],
  isRegex?: boolean,
): FilterRule[] {
  const focusRules = rules.filter(r => r.mode === 'focus');
  const existing = rules.find(r => r.pattern === pattern);
  if (existing) {
    if (existing.mode === mode && existing.isRegex === isRegex) return rules; // no change
    return rules.map(r =>
      r.pattern === pattern ? { ...r, mode, isRegex, color: mode === 'focus' ? getFocusColor(focusRules.length) : undefined } : r
    );
  }
  const newRule: FilterRule = {
    id: `filter_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
    pattern,
    mode,
    isRegex,
    color: mode === 'focus' ? getFocusColor(focusRules.length) : undefined,
    occurrenceIndices: logIndices ?? [],
    currentOccurrence: 0,
  };
  return [...rules, newRule];
}

export function removeFilter(rules: FilterRule[], pattern: string): FilterRule[] {
  return rules.filter(r => r.pattern !== pattern);
}

export function updateOccurrences(
  rules: FilterRule[],
  pattern: string,
  occurrenceIndices: number[],
): FilterRule[] {
  return rules.map(r => r.pattern === pattern ? { ...r, occurrenceIndices } : r);
}

export function navigateOccurrence(
  rules: FilterRule[],
  pattern: string,
  direction: 'prev' | 'next',
): { rules: FilterRule[]; targetIndex: number | null } {
  const rule = rules.find(r => r.pattern === pattern);
  if (!rule || rule.occurrenceIndices.length === 0) return { rules, targetIndex: null };

  const len = rule.occurrenceIndices.length;
  let nextOcc = direction === 'next'
    ? (rule.currentOccurrence + 1) % len
    : (rule.currentOccurrence - 1 + len) % len;

  const updated = rules.map(r =>
    r.pattern === pattern ? { ...r, currentOccurrence: nextOcc } : r
  );
  return { rules: updated, targetIndex: rule.occurrenceIndices[nextOcc] };
}
