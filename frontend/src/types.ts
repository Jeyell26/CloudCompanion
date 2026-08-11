// LogPulse — core type definitions

export interface AuthSession {
  token: string;
  region: string;
  roleArn: string;
  externalId?: string;
}

export interface LogGroup {
  name: string;
  arn?: string;
  storedBytes?: number;
  retentionDays?: number;
}

export interface LogEvent {
  id: string; // unique per event for React keys
  timestamp: number; // epoch ms
  logGroup: string;
  logStream: string;
  message: string;
  ingestionTime?: number;
}

export type SessionMode = 'idle' | 'live-tail' | 'range-query';

export interface TimeRange {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  endDate: string;
  endTime: string;
}

// Tracker
export interface TrackerEntry {
  pattern: string;
  count: number;
  lastSeen: number;
}

export interface TrackerState {
  mostCommon: TrackerEntry[];
  newMessages: TrackerEntry[];
  frequencyMap: Record<string, number>;
  seenPatterns: Set<string>;
  totalProcessed: number;
}

// Filters
export type FilterMode = 'focus' | 'ignore' | 'group';

export interface FilterRule {
  id: string;
  pattern: string;
  mode: FilterMode;
  isRegex?: boolean;
  color?: string; // only for focus
  occurrenceIndices: number[]; // indices in the log buffer
  currentOccurrence: number; // for prev/next navigation
}

// Settings
export interface NormalizationRule {
  id: string;
  label: string;
  regex: string;
  replacement: string;
  enabled: boolean;
  isBuiltIn: boolean;
}

export type OverflowBehavior = 'ask' | 'drop' | 'download';
export type FilterPersistence = 'ask' | 'always' | 'never';

export interface LogPulseSettings {
  mostCommonLimit: number;
  newMessagesLimit: number;
  defaultTimeWindowHours: number;
  maxTimeWindowHours: number;
  logBufferLimit: number;
  overflowBehavior: OverflowBehavior;
  filterPersistence: FilterPersistence;
  normalizationRules: NormalizationRule[];
}

export const DEFAULT_SETTINGS: LogPulseSettings = {
  mostCommonLimit: 10,
  newMessagesLimit: 10,
  defaultTimeWindowHours: 1,
  maxTimeWindowHours: 24,
  logBufferLimit: 1000,
  overflowBehavior: 'ask',
  filterPersistence: 'ask',
  normalizationRules: [
    { id: 'uuid', label: 'UUID', regex: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', replacement: '{uuid}', enabled: false, isBuiltIn: true },
    { id: 'number', label: 'Numbers', regex: '\\b\\d+(\\.\\d+)?\\b', replacement: '{n}', enabled: false, isBuiltIn: true },
    { id: 'ip', label: 'IP Addresses', regex: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', replacement: '{ip}', enabled: false, isBuiltIn: true },
    { id: 'timestamp', label: 'Timestamps', regex: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z?', replacement: '{ts}', enabled: false, isBuiltIn: true },
    { id: 'path', label: 'File Paths', regex: '(\/[\\w.\\-]+)+', replacement: '{path}', enabled: false, isBuiltIn: true },
  ],
};
