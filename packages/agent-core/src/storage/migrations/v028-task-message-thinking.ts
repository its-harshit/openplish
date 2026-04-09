import type { Database } from 'better-sqlite3';
import type { Migration } from './index.js';

/**
 * Store assistant reasoning separately so the UI can show it in a collapsed control
 * without mixing it into the main markdown body.
 */
export const migration: Migration = {
  version: 28,
  up: (db: Database) => {
    db.exec(`
      ALTER TABLE task_messages ADD COLUMN thinking TEXT
    `);
  },
};
