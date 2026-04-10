import type { Database } from 'better-sqlite3';
import type { Migration } from './index.js';

/**
 * Persisted file-operation policy mode so packaged installs can override env without editing files.
 * inherit = use SOMEHOW_FILE_OPERATION_POLICY env; standard / create_copy_only force that mode.
 */
export const migration: Migration = {
  version: 27,
  up: (db: Database) => {
    db.exec(`
      ALTER TABLE app_settings ADD COLUMN file_operation_policy_mode TEXT NOT NULL DEFAULT 'inherit'
    `);
  },
};
