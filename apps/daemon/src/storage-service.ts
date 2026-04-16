import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { createStorage, type StorageAPI } from '@somehow_ai/agent-core';
import { log } from './logger.js';

const DEV_DEFAULT_DATA_DIR = join(homedir(), '.somehow');

export class StorageService {
  private storage: StorageAPI | null = null;

  /**
   * Initialize storage.
   *
   * @param dataDir — Data directory. Required in production (passed via --data-dir).
   *                   In dev mode (no --data-dir), falls back to `~/.somehow`.
   */
  initialize(dataDir?: string): StorageAPI {
    const dir = dataDir || DEV_DEFAULT_DATA_DIR;
    mkdirSync(dir, { recursive: true, mode: 0o700 });

    // Match the desktop app's database naming:
    // - Packaged (SOMEHOW_IS_PACKAGED=1): somehow.db + secure-storage.json
    // - Dev mode: somehow-dev.db + secure-storage-dev.json
    // Renames legacy somehow*.db files in the same directory when present.
    const isPackaged = process.env.SOMEHOW_IS_PACKAGED === '1';
    const dbName = isPackaged ? 'somehow.db' : 'somehow-dev.db';
    const secureFileName = isPackaged ? 'secure-storage.json' : 'secure-storage-dev.json';
    const databasePath = join(dir, dbName);
    const legacyPath = join(dir, isPackaged ? 'somehow.db' : 'somehow-dev.db');
    if (!existsSync(databasePath) && existsSync(legacyPath)) {
      try {
        renameSync(legacyPath, databasePath);
        for (const suf of ['-wal', '-shm'] as const) {
          const from = legacyPath + suf;
          const to = databasePath + suf;
          if (existsSync(from)) {
            renameSync(from, to);
          }
        }
      } catch {
        /* locked or permission — may succeed on next start */
      }
    }

    this.storage = createStorage({
      databasePath,
      runMigrations: true,
      userDataPath: dir,
      secureStorageFileName: secureFileName,
    });

    this.storage.initialize();
    log.info(`[StorageService] Database initialized at ${databasePath}`);
    return this.storage;
  }

  getStorage(): StorageAPI {
    if (!this.storage) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return this.storage;
  }

  close(): void {
    if (this.storage) {
      this.storage.close();
      this.storage = null;
      log.info('[StorageService] Database closed');
    }
  }
}
