import type { TrackerState, TrackerEntry, LogEvent, NormalizationRule, LogPulseSettings, FilterRule } from '../../types';

const FOCUS_COLORS = [
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#a78bfa', // violet
  '#fb923c', // orange
];

export function getFocusColor(index: number): string {
  return FOCUS_COLORS[index % FOCUS_COLORS.length];
}

export function normalizeMessage(
  message: string,
  rules: NormalizationRule[],
): string {
  let normalized = message.trim();
  const activeRules = rules.filter(r => r.enabled);
  for (const rule of activeRules) {
    try {
      const re = new RegExp(rule.regex, 'g');
      normalized = normalized.replace(re, rule.replacement);
    } catch {
      // skip invalid regex
    }
  }
  return normalized;
}

/**
 * Test whether a raw log message matches a filter rule.
 * Always normalizes the raw message first so that normalization rules
 * (e.g. \d+MB → {memory}) are applied before comparison.
 */
export function matchesRule(
  rawMessage: string,
  rule: { pattern: string; isRegex?: boolean },
  normRules: NormalizationRule[],
): boolean {
  const normalized = normalizeMessage(rawMessage, normRules);
  if (rule.isRegex) {
    try { return new RegExp(rule.pattern).test(normalized); } catch { return false; }
  }
  // Plain-text: both the normalized message and the stored pattern use {variable} tokens,
  // so a direct substring check on the normalized message is correct.
  return normalized.includes(rule.pattern);
}

export function createTrackerState(): TrackerState {
  return {
    mostCommon: [],
    newMessages: [],
    frequencyMap: {},
    seenPatterns: new Set(),
    totalProcessed: 0,
  };
}

export function processLog(
  state: TrackerState,
  log: LogEvent,
  settings: LogPulseSettings,
  filterRules: FilterRule[] = [],
): TrackerState {
  let pattern = normalizeMessage(log.message, settings.normalizationRules);

  // If a filter rule matches (after normalization), count the log under the rule pattern for grouping
  for (const rule of filterRules) {
    if (matchesRule(log.message, rule, settings.normalizationRules)) {
      pattern = rule.pattern;
      break;
    }
  }

  const newFrequencyMap = { ...state.frequencyMap };
  newFrequencyMap[pattern] = (newFrequencyMap[pattern] ?? 0) + 1;

  const newSeenPatterns = new Set(state.seenPatterns);
  let newMessages = [...state.newMessages];

  if (!newSeenPatterns.has(pattern)) {
    newSeenPatterns.add(pattern);
    if (newMessages.length < settings.newMessagesLimit) {
      newMessages = [
        { pattern, count: 1, lastSeen: log.timestamp },
        ...newMessages,
      ].slice(0, settings.newMessagesLimit);
    }
  } else {
    // Update count in newMessages if present
    newMessages = newMessages.map(m =>
      m.pattern === pattern ? { ...m, count: m.count + 1, lastSeen: log.timestamp } : m
    );
  }

  // Rebuild mostCommon from frequency map
  const mostCommon: TrackerEntry[] = Object.entries(newFrequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, settings.mostCommonLimit)
    .map(([pat, count]) => ({
      pattern: pat,
      count,
      lastSeen: pat === pattern ? log.timestamp : (state.mostCommon.find(m => m.pattern === pat)?.lastSeen ?? log.timestamp),
    }));

  return {
    mostCommon,
    newMessages,
    frequencyMap: newFrequencyMap,
    seenPatterns: newSeenPatterns,
    totalProcessed: state.totalProcessed + 1,
  };
}

export function resetTrackerState(): TrackerState {
  return createTrackerState();
}
