import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { copyFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface JsonFileStore<T> {
  read(): T;
  write(value: T): T;
  update(mutator: (current: T) => T): T;
  getMeta(): JsonFileMeta;
}

export interface JsonFileMeta {
  filePath: string;
  version: number;
  lastLoadedAt?: string;
  lastSavedAt?: string;
  recoveredFromCorruption: boolean;
}

export function createJsonFileStore<T>(options: {
  filePath: string;
  defaultValue: T;
  normalize: (value: unknown) => T;
}): JsonFileStore<T> {
  const { filePath, defaultValue, normalize } = options;
  let version = 0;
  let lastLoadedAt: string | undefined;
  let lastSavedAt: string | undefined;
  let recoveredFromCorruption = false;

  ensureFile(filePath, defaultValue);

  function read() {
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
      const value = normalize(parsed);
      lastLoadedAt = new Date().toISOString();
      return value;
    } catch {
      recoveredFromCorruption = true;
      backupCorruptFile(filePath);
      return write(structuredClone(defaultValue));
    }
  }

  function write(value: T) {
    const normalized = normalize(value);
    mkdirSync(dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.${version + 1}.tmp`;
    writeFileSync(tempPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
    renameSync(tempPath, filePath);
    version += 1;
    lastSavedAt = new Date().toISOString();
    return normalized;
  }

  function update(mutator: (current: T) => T) {
    return write(mutator(read()));
  }

  function getMeta(): JsonFileMeta {
    return {
      filePath,
      version,
      ...(lastLoadedAt ? { lastLoadedAt } : {}),
      ...(lastSavedAt ? { lastSavedAt } : {}),
      recoveredFromCorruption,
    };
  }

  return { read, write, update, getMeta };
}

function ensureFile<T>(filePath: string, defaultValue: T) {
  if (existsSync(filePath)) return;
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(defaultValue, null, 2)}\n`, 'utf8');
}

function backupCorruptFile(filePath: string) {
  if (!existsSync(filePath)) return;
  try {
    copyFileSync(filePath, `${filePath}.corrupt.${Date.now()}.bak`);
  } catch {
    // Recovery should still proceed even if a backup cannot be written.
  }
}
