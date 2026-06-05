import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createJsonFileStore, type JsonFileMeta } from './jsonFileStore.ts';

export type OverrideEntityType = 'node' | 'edge' | 'event' | 'source';

export interface OverrideRecord {
  id: string;
  entityType: OverrideEntityType;
  entityId: string;
  field: string;
  before: unknown;
  after: unknown;
  createdAt: string;
  updatedBy: string;
  reason?: string;
  sourceTags: string[];
  metadata?: Record<string, unknown>;
}

interface OverrideState {
  overrides: OverrideRecord[];
}

export interface OverrideStore {
  getOverrides(filters?: Partial<Pick<OverrideRecord, 'entityType' | 'entityId' | 'field'>>): OverrideRecord[];
  addOverride(input: Omit<OverrideRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): OverrideRecord;
  addOverrides(records: Array<Omit<OverrideRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }>): OverrideRecord[];
  getMeta(): JsonFileMeta;
}

const DEFAULT_STATE: OverrideState = {
  overrides: [],
};

export function createOverrideStore(filePath = join(process.cwd(), 'server', 'data', 'override-store.json')): OverrideStore {
  const store = createJsonFileStore({
    filePath,
    defaultValue: DEFAULT_STATE,
    normalize: normalizeOverrideState,
  });

  function makeRecord(input: Omit<OverrideRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): OverrideRecord {
    return {
      id: input.id ?? `override_${Date.now()}_${randomUUID().slice(0, 8)}`,
      entityType: input.entityType,
      entityId: input.entityId,
      field: input.field,
      before: input.before,
      after: input.after,
      createdAt: input.createdAt ?? new Date().toISOString(),
      updatedBy: input.updatedBy,
      ...(input.reason ? { reason: input.reason } : {}),
      sourceTags: input.sourceTags,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };
  }

  return {
    getOverrides(filters = {}) {
      return store.read().overrides.filter((record) =>
        (!filters.entityType || record.entityType === filters.entityType) &&
        (!filters.entityId || record.entityId === filters.entityId) &&
        (!filters.field || record.field === filters.field),
      );
    },
    addOverride(input) {
      return this.addOverrides([input])[0];
    },
    addOverrides(records) {
      const nextRecords = records.map(makeRecord).filter((record) => record.entityType && record.entityId && record.field);
      const nextState = store.update((state) => ({
        ...state,
        overrides: [...nextRecords, ...state.overrides].slice(0, 1000),
      }));
      return nextState.overrides.slice(0, nextRecords.length);
    },
    getMeta: store.getMeta,
  };
}

function normalizeOverrideState(value: unknown): OverrideState {
  if (!isRecord(value)) return structuredClone(DEFAULT_STATE);
  return {
    overrides: Array.isArray(value.overrides)
      ? value.overrides.map(parseOverrideRecord).filter((record) => record !== null)
      : [],
  };
}

function parseOverrideRecord(value: unknown): OverrideRecord | null {
  if (!isRecord(value)) return null;
  const id = asCleanString(value.id);
  const entityType = parseEntityType(value.entityType);
  const entityId = asCleanString(value.entityId);
  const field = asCleanString(value.field);
  const updatedBy = asCleanString(value.updatedBy) || 'api';
  if (!id || !entityType || !entityId || !field) return null;

  return {
    id,
    entityType,
    entityId,
    field,
    before: value.before,
    after: value.after,
    createdAt: asCleanString(value.createdAt) || new Date().toISOString(),
    updatedBy,
    ...(typeof value.reason === 'string' && value.reason.trim() ? { reason: value.reason.trim() } : {}),
    sourceTags: Array.isArray(value.sourceTags)
      ? value.sourceTags.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
      : [],
    ...(isRecord(value.metadata) ? { metadata: value.metadata } : {}),
  };
}

function parseEntityType(value: unknown): OverrideEntityType | undefined {
  return value === 'node' || value === 'edge' || value === 'event' || value === 'source' ? value : undefined;
}

function asCleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
