import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { createStorage, type StorageAPI } from '@somehow_ai/agent-core';
// Deep import for legacy migration only — getDatabase is intentionally not part of StorageAPI
import { getDatabase as coreGetDatabase } from '@somehow_ai/agent-core/storage/database';
import type { Database } from 'better-sqlite3';
import { importLegacyElectronStoreData } from './electronStoreImport';

let _storage: StorageAPI | null = null;

export function getDatabasePath(): string {
  const userData = app.getPath('userData');
  const dbName = app.isPackaged ? 'somehow.db' : 'somehow-dev.db';
  const newPath = path.join(userData, dbName);
  const legacyName = app.isPackaged ? 'accomplish.db' : 'accomplish-dev.db';
  const legacyPath = path.join(userData, legacyName);
  if (!fs.existsSync(newPath) && fs.existsSync(legacyPath)) {
    try {
      fs.renameSync(legacyPath, newPath);
      for (const suf of ['-wal', '-shm'] as const) {
        const from = legacyPath + suf;
        const to = newPath + suf;
        if (fs.existsSync(from)) {
          fs.renameSync(from, to);
        }
      }
    } catch {
      /* DB may be locked; next launch may succeed */
    }
  }
  return newPath;
}

export function getStorage(): StorageAPI {
  if (!_storage) {
    _storage = createStorage({
      databasePath: getDatabasePath(),
      runMigrations: true,
      userDataPath: app.getPath('userData'),
      secureStorageFileName: app.isPackaged ? 'secure-storage.json' : 'secure-storage-dev.json',
    });
  }
  return _storage;
}

/**
 * Initialize both the database and secure storage.
 * On first run, also imports data from the legacy electron-store format.
 */
export function initializeStorage(): void {
  const storage = getStorage();
  if (!storage.isDatabaseInitialized()) {
    storage.initialize();

    // One-time legacy data import from old electron-store format
    const db: Database = coreGetDatabase();
    importLegacyElectronStoreData(db);
  }
}

export function closeStorage(): void {
  if (_storage) {
    _storage.close();
    _storage = null;
  }
}

/**
 * Reset the storage singleton after CLEAN_START deletes the userData directory.
 * Closes the open database handle before nulling the reference.
 */
export function resetStorageSingleton(): void {
  if (_storage) {
    _storage.close();
    _storage = null;
  }
}
